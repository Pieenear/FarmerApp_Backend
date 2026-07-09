import { prisma } from "../../lib/prisma.js";
import { RequestType, RequestStatus, Role } from "../../generated/prisma/client.js";
const detailCreateMap = {
    [RequestType.soil_testing]: "soilTestDetail",
    [RequestType.water_testing]: "waterTestDetail",
    [RequestType.labour_management]: "labourRequestDetail",
    [RequestType.farming_equipment]: "equipmentRequestDetail",
    [RequestType.fertilizer_management]: "fertilizerRequestDetail",
    [RequestType.pesticide_management]: "pesticideRequestDetail",
    [RequestType.storage_request]: "storageRequestDetail",
    [RequestType.group_forming]: "groupFormingRequestDetail",
    [RequestType.crop_selling]: "cropSellingRequestDetail",
};
// Common include object to load all possible details and relations
const requestDetailsInclude = {
    attachments: true,
    soilTestDetail: true,
    waterTestDetail: true,
    labourRequestDetail: true,
    equipmentRequestDetail: true,
    fertilizerRequestDetail: true,
    pesticideRequestDetail: true,
    storageRequestDetail: true,
    groupFormingRequestDetail: true,
    cropSellingRequestDetail: true,
    assignedStaff: true,
    area: true,
    farmer: {
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
        },
    },
};
/**
 * Service to raise a new request for a farmer
 */
export const raiseRequestService = async (farmerId, data) => {
    const { requestType, description, attachments, details } = data;
    // Retrieve farmer to check areaId
    const farmer = await prisma.user.findUnique({
        where: { id: farmerId },
    });
    if (!farmer) {
        throw new Error("Farmer not found.");
    }
    // Create ServiceRequest and details inside a transaction
    return await prisma.$transaction(async (tx) => {
        const request = await tx.serviceRequest.create({
            data: {
                farmerId,
                requestType,
                areaId: farmer.areaId,
                description: description || null,
                status: RequestStatus.pending,
                attachments: attachments && attachments.length > 0
                    ? {
                        create: attachments.map((url) => ({
                            fileUrl: url,
                            fileType: "image",
                        })),
                    }
                    : undefined,
                [detailCreateMap[requestType]]: {
                    create: details,
                },
            },
            include: requestDetailsInclude,
        });
        // Log the initial state
        await tx.requestStatusLog.create({
            data: {
                requestId: request.id,
                changedByUserId: farmerId,
                previousStatus: null,
                newStatus: RequestStatus.pending,
                remarks: "Request raised by farmer.",
            },
        });
        return request;
    }, {
        timeout: 20000
    });
};
/**
 * Service to fetch all requests for a specific farmer (with optional status / type filters)
 */
export const getFarmerRequestsService = async (farmerId, filters) => {
    return await prisma.serviceRequest.findMany({
        where: {
            farmerId,
            ...(filters.status && { status: filters.status }),
            ...(filters.requestType && { requestType: filters.requestType }),
        },
        include: requestDetailsInclude,
        orderBy: { createdAt: "desc" },
    });
};
/**
 * Service to fetch requests for admin panel (with status / type / area filters)
 */
export const getAdminRequestsService = async (filters) => {
    return await prisma.serviceRequest.findMany({
        where: {
            ...(filters.status && { status: filters.status }),
            ...(filters.requestType && { requestType: filters.requestType }),
            ...(filters.areaId && { areaId: filters.areaId }),
        },
        include: requestDetailsInclude,
        orderBy: { createdAt: "desc" },
    });
};
/**
 * Service to get a request by ID, verifying ownership if the requester is a farmer
 */
export const getRequestByIdService = async (id, userId, userRole) => {
    const request = await prisma.serviceRequest.findUnique({
        where: { id },
        include: {
            ...requestDetailsInclude,
            statusLogs: {
                orderBy: { createdAt: "desc" },
                include: {
                    changedByUser: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                        },
                    },
                },
            },
        },
    });
    if (!request) {
        throw new Error("Service request not found.");
    }
    // Enforce ownership for farmers
    if (userRole === Role.farmer && request.farmerId !== userId) {
        throw new Error("Unauthorized access to this service request.");
    }
    return request;
};
/**
 * Service to update request status (Admin function)
 */
export const updateRequestStatusService = async (requestId, adminId, data) => {
    const { status, remarks, scheduledDate } = data;
    const request = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
    });
    if (!request) {
        throw new Error("Service request not found.");
    }
    const previousStatus = request.status;
    return await prisma.$transaction(async (tx) => {
        // Determine completedAt timestamp if transitioned to completed status
        const completedAt = status === RequestStatus.completed ? new Date() : null;
        // Update status
        const updatedRequest = await tx.serviceRequest.update({
            where: { id: requestId },
            data: {
                status,
                scheduledDate: scheduledDate || undefined,
                completedAt,
                assignedByAdminId: adminId,
            },
            include: requestDetailsInclude,
        });
        // Create status change audit log
        await tx.requestStatusLog.create({
            data: {
                requestId,
                changedByUserId: adminId,
                previousStatus,
                newStatus: status,
                remarks: remarks || `Status updated by Admin.`,
            },
        });
        // Side Effect: If crop selling request is accepted, create a CropListing record
        if (request.requestType === RequestType.crop_selling && status === RequestStatus.accepted) {
            const detail = await tx.cropSellingRequestDetail.findUnique({
                where: { requestId },
            });
            if (detail) {
                const existingListing = await tx.cropListing.findFirst({
                    where: { requestId },
                });
                if (!existingListing) {
                    await tx.cropListing.create({
                        data: {
                            farmerId: request.farmerId,
                            requestId,
                            cropType: detail.cropType,
                            quantityKg: detail.quantityKg,
                            askingPrice: detail.expectedPrice,
                            status: "open",
                        },
                    });
                }
            }
        }
        return updatedRequest;
    }, {
        timeout: 20000
    });
};
