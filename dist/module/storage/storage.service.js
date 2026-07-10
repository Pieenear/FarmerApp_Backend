import { prisma } from "../../lib/prisma.js";
import { StorageAllocationStatus, RequestStatus, RequestType, Prisma, } from "../../generated/prisma/client.js";
// ==========================================
// 1. STORAGE UNIT SERVICES
// ==========================================
export const createStorageUnitService = async (data) => {
    const { name, location, areaId, totalCapacityKg } = data;
    return await prisma.storageUnit.create({
        data: {
            name: name || null,
            location: location || null,
            areaId: BigInt(areaId),
            totalCapacityKg,
            availableCapacityKg: totalCapacityKg,
        },
        include: {
            area: true,
        },
    });
};
export const listStorageUnitsService = async (areaId) => {
    return await prisma.storageUnit.findMany({
        where: {
            areaId: areaId ? BigInt(areaId) : undefined,
        },
        include: {
            area: true,
        },
        orderBy: { name: "asc" },
    });
};
export const getStorageUnitByIdService = async (id) => {
    const unit = await prisma.storageUnit.findUnique({
        where: { id },
        include: {
            area: true,
            allocations: {
                include: {
                    farmer: { select: { id: true, name: true, phone: true } },
                    request: true,
                },
            },
        },
    });
    if (!unit) {
        throw new Error("Storage Unit not found.");
    }
    return unit;
};
export const updateStorageUnitService = async (id, data) => {
    const { name, location, areaId, totalCapacityKg } = data;
    const existing = await prisma.storageUnit.findUnique({
        where: { id },
        include: { allocations: true },
    });
    if (!existing) {
        throw new Error("Storage Unit not found.");
    }
    // Calculate new available capacity if total capacity is updated
    let newAvailableCapacity = existing.availableCapacityKg;
    if (totalCapacityKg !== undefined) {
        const activeAllocationsSum = existing.allocations
            .filter((a) => a.status !== StorageAllocationStatus.vacated)
            .reduce((sum, a) => sum + Number(a.allocatedCapacityKg || 0), 0);
        newAvailableCapacity = new Prisma.Decimal(totalCapacityKg - activeAllocationsSum);
        if (Number(newAvailableCapacity) < 0) {
            throw new Error("Cannot decrease capacity: existing active allocations exceed new total capacity.");
        }
    }
    return await prisma.storageUnit.update({
        where: { id },
        data: {
            name: name !== undefined ? name || null : undefined,
            location: location !== undefined ? location || null : undefined,
            areaId: areaId !== undefined ? BigInt(areaId) : undefined,
            totalCapacityKg: totalCapacityKg !== undefined ? totalCapacityKg : undefined,
            availableCapacityKg: totalCapacityKg !== undefined ? newAvailableCapacity : undefined,
        },
        include: {
            area: true,
        },
    });
};
export const deleteStorageUnitService = async (id) => {
    const existing = await prisma.storageUnit.findUnique({
        where: { id },
        include: { allocations: true },
    });
    if (!existing) {
        throw new Error("Storage Unit not found.");
    }
    const activeAllocations = existing.allocations.filter((a) => a.status !== StorageAllocationStatus.vacated);
    if (activeAllocations.length > 0) {
        throw new Error("Cannot delete storage unit with active or reserved allocations.");
    }
    return await prisma.storageUnit.delete({
        where: { id },
    });
};
// ==========================================
// 2. STORAGE ALLOCATION SERVICES
// ==========================================
export const createAllocationService = async (data, adminId) => {
    const { storageUnitId, requestId, allocatedCapacityKg, startDate, endDate, status } = data;
    const request = await prisma.serviceRequest.findUnique({
        where: { id: BigInt(requestId) },
        include: { storageRequestDetail: true },
    });
    if (!request) {
        throw new Error("Service request not found.");
    }
    if (request.requestType !== RequestType.storage_request) {
        throw new Error("Service request is not a storage request.");
    }
    if (request.status === RequestStatus.completed ||
        request.status === RequestStatus.cancelled ||
        request.status === RequestStatus.rejected) {
        throw new Error(`Cannot allocate storage for a request with status: ${request.status}`);
    }
    const unit = await prisma.storageUnit.findUnique({
        where: { id: BigInt(storageUnitId) },
    });
    if (!unit) {
        throw new Error("Storage Unit not found.");
    }
    if (Number(unit.availableCapacityKg || 0) < allocatedCapacityKg) {
        throw new Error(`Insufficient capacity in storage unit. Available: ${unit.availableCapacityKg} kg, Requested: ${allocatedCapacityKg} kg`);
    }
    // Parse or calculate dates
    const parsedStartDate = startDate ? new Date(startDate) : (request.storageRequestDetail?.preferredStartDate || new Date());
    let parsedEndDate = endDate ? new Date(endDate) : null;
    if (!parsedEndDate && request.storageRequestDetail?.storageDurationDays) {
        parsedEndDate = new Date(parsedStartDate.getTime() + request.storageRequestDetail.storageDurationDays * 24 * 60 * 60 * 1000);
    }
    else if (!parsedEndDate) {
        parsedEndDate = new Date(parsedStartDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    }
    const previousStatus = request.status;
    return await prisma.$transaction(async (tx) => {
        // 1. Create the StorageAllocation
        const allocation = await tx.storageAllocation.create({
            data: {
                storageUnitId: BigInt(storageUnitId),
                requestId: BigInt(requestId),
                farmerId: request.farmerId,
                allocatedCapacityKg,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                status: status || StorageAllocationStatus.reserved,
                allocatedByAdminId: adminId,
            },
            include: {
                storageUnit: true,
                request: true,
                farmer: { select: { id: true, name: true } },
            },
        });
        // 2. Deduct capacity from StorageUnit
        await tx.storageUnit.update({
            where: { id: BigInt(storageUnitId) },
            data: {
                availableCapacityKg: Number(unit.availableCapacityKg || 0) - allocatedCapacityKg,
            },
        });
        // 3. Set Service Request status to assigned
        await tx.serviceRequest.update({
            where: { id: BigInt(requestId) },
            data: {
                status: RequestStatus.assigned,
                assignedByAdminId: adminId,
            },
        });
        // 4. Log the request status transition
        await tx.requestStatusLog.create({
            data: {
                requestId: BigInt(requestId),
                changedByUserId: adminId,
                previousStatus,
                newStatus: RequestStatus.assigned,
                remarks: `Storage space allocated in unit "${unit.name}".`,
            },
        });
        return allocation;
    }, {
        timeout: 20000
    });
};
export const updateAllocationStatusService = async (id, data, adminId) => {
    const { status } = data;
    const allocation = await prisma.storageAllocation.findUnique({
        where: { id },
        include: { storageUnit: true, request: true },
    });
    if (!allocation) {
        throw new Error("Storage allocation not found.");
    }
    const previousStatus = allocation.status;
    if (previousStatus === status) {
        return allocation;
    }
    return await prisma.$transaction(async (tx) => {
        // 1. Update Allocation Status
        const updatedAllocation = await tx.storageAllocation.update({
            where: { id },
            data: { status },
            include: {
                storageUnit: true,
                request: true,
            },
        });
        // 2. State machine capacity & request transition changes
        if (status === StorageAllocationStatus.vacated && previousStatus !== StorageAllocationStatus.vacated) {
            // Re-add capacity to StorageUnit
            await tx.storageUnit.update({
                where: { id: allocation.storageUnitId },
                data: {
                    availableCapacityKg: Number(allocation.storageUnit.availableCapacityKg || 0) + Number(allocation.allocatedCapacityKg || 0),
                },
            });
            // Complete the Service Request
            await tx.serviceRequest.update({
                where: { id: allocation.requestId },
                data: {
                    status: RequestStatus.completed,
                    completedAt: new Date(),
                },
            });
            // Audit status transition log
            await tx.requestStatusLog.create({
                data: {
                    requestId: allocation.requestId,
                    changedByUserId: adminId,
                    previousStatus: RequestStatus.assigned,
                    newStatus: RequestStatus.completed,
                    remarks: `Storage allocation vacated. Capacity released back to unit "${allocation.storageUnit.name}".`,
                },
            });
        }
        else if (previousStatus === StorageAllocationStatus.vacated && status !== StorageAllocationStatus.vacated) {
            // Re-allocate capacity from StorageUnit (and check limit)
            const currentUnit = await tx.storageUnit.findUnique({
                where: { id: allocation.storageUnitId },
            });
            if (!currentUnit) {
                throw new Error("Associated Storage Unit not found.");
            }
            if (Number(currentUnit.availableCapacityKg || 0) < Number(allocation.allocatedCapacityKg || 0)) {
                throw new Error("Cannot reactivate: Insufficient capacity available in Storage Unit.");
            }
            await tx.storageUnit.update({
                where: { id: allocation.storageUnitId },
                data: {
                    availableCapacityKg: Number(currentUnit.availableCapacityKg || 0) - Number(allocation.allocatedCapacityKg || 0),
                },
            });
            // Revert request status to assigned
            await tx.serviceRequest.update({
                where: { id: allocation.requestId },
                data: {
                    status: RequestStatus.assigned,
                    completedAt: null,
                },
            });
            // Audit status transition log
            await tx.requestStatusLog.create({
                data: {
                    requestId: allocation.requestId,
                    changedByUserId: adminId,
                    previousStatus: RequestStatus.completed,
                    newStatus: RequestStatus.assigned,
                    remarks: "Storage allocation reactivated (re-reserved).",
                },
            });
        }
        return updatedAllocation;
    }, {
        timeout: 20000
    });
};
