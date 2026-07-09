import { prisma } from "../../lib/prisma.js";
import { AvailabilityStatus, RequestStatus } from "../../generated/prisma/client.js";
import { CreateStaffInput, UpdateStaffInput } from "./staff.schema.js";

// Service to create a new Ground Staff member

export const createStaffService = async (data: CreateStaffInput) => {
  const { name, phone, areaId, specialization, availabilityStatus } = data;

  // Verify area exists
  const area = await prisma.area.findUnique({
    where: { id: BigInt(areaId) },
  });
  if (!area) {
    throw new Error("Specified Area does not exist.");
  }

  // Verify phone is unique
  const existingStaff = await prisma.groundStaff.findFirst({
    where: { phone },
  });
  if (existingStaff) {
    throw new Error("Phone number is already registered for another staff member.");
  }

  return await prisma.groundStaff.create({
    data: {
      name,
      phone,
      areaId: BigInt(areaId),
      specialization: specialization || null,
      availabilityStatus: availabilityStatus || AvailabilityStatus.available,
    },
    include: { area: true },
  });
};

// Service to retrieve staff members with optional filters

export const getStaffListService = async (filters: {
  areaId?: bigint;
  availabilityStatus?: AvailabilityStatus;
}) => {
  return await prisma.groundStaff.findMany({
    where: {
      ...(filters.areaId && { areaId: filters.areaId }),
      ...(filters.availabilityStatus && { availabilityStatus: filters.availabilityStatus }),
    },
    include: { area: true },
    orderBy: { name: "asc" },
  });
};

// Service to retrieve a specific Ground Staff member by ID

export const getStaffByIdService = async (id: bigint) => {
  const staff = await prisma.groundStaff.findUnique({
    where: { id },
    include: {
      area: true,
      assignedRequests: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!staff) {
    throw new Error("Ground Staff member not found.");
  }

  return staff;
};

// Service to update Ground Staff member profile details
 
export const updateStaffService = async (id: bigint, data: UpdateStaffInput) => {
  const { name, phone, areaId, specialization, availabilityStatus } = data;

  // Check if staff member exists
  const staff = await prisma.groundStaff.findUnique({
    where: { id },
  });
  if (!staff) {
    throw new Error("Ground Staff member not found.");
  }

  // Validate phone uniqueness if modified
  if (phone && phone !== staff.phone) {
    const existing = await prisma.groundStaff.findFirst({
      where: { phone },
    });
    if (existing) {
      throw new Error("Phone number is already in use by another staff member.");
    }
  }

  // Validate Area exists if modified
  if (areaId) {
    const area = await prisma.area.findUnique({
      where: { id: BigInt(areaId) },
    });
    if (!area) {
      throw new Error("Specified Area does not exist.");
    }
  }

  return await prisma.groundStaff.update({
    where: { id },
    data: {
      name,
      phone,
      areaId: areaId ? BigInt(areaId) : undefined,
      specialization: specialization !== undefined ? specialization : undefined,
      availabilityStatus: availabilityStatus || undefined,
    },
    include: { area: true },
  });
};

// Service to delete a Ground Staff member
 
export const deleteStaffService = async (id: bigint) => {
  const staff = await prisma.groundStaff.findUnique({
    where: { id },
  });
  if (!staff) {
    throw new Error("Ground Staff member not found.");
  }

  return await prisma.groundStaff.delete({
    where: { id },
  });
};

// Service to assign a Ground Staff member to a Service Request (Admin action)
 
export const assignRequestToStaffService = async (
  requestId: bigint,
  staffId: bigint,
  adminId: bigint
) => {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) {
    throw new Error("Service request not found.");
  }

  // Prevent assignment on completed, cancelled or rejected requests
  if (
    request.status === RequestStatus.completed ||
    request.status === RequestStatus.cancelled ||
    request.status === RequestStatus.rejected
  ) {
    throw new Error(`Cannot assign staff to a request with status: ${request.status}`);
  }

  const staff = await prisma.groundStaff.findUnique({
    where: { id: staffId },
  });
  if (!staff) {
    throw new Error("Ground Staff member not found.");
  }

  const previousStatus = request.status;

  return await prisma.$transaction(async (tx) => {
    // 1. Update the request status and assignment details
    const updatedRequest = await tx.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.assigned,
        assignedStaffId: staffId,
        assignedByAdminId: adminId,
      },
      include: {
        assignedStaff: true,
        area: true,
      },
    });

    // 2. Mark the staff member status as busy
    await tx.groundStaff.update({
      where: { id: staffId },
      data: {
        availabilityStatus: AvailabilityStatus.busy,
      },
    });

    // 3. Create audit trail log
    await tx.requestStatusLog.create({
      data: {
        requestId,
        changedByUserId: adminId,
        previousStatus,
        newStatus: RequestStatus.assigned,
        remarks: `Assigned ground staff member: ${staff.name} (${staff.phone}).`,
      },
    });

    return updatedRequest;
  }, {
    timeout: 20000
  });
};
