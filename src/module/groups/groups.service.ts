import { prisma } from "../../lib/prisma.js";
import { Role, GroupStatus, GroupRole } from "../../generated/prisma/client.js";
import { CreateGroupInput, UpdateGroupInput } from "./groups.schema.js";

// ==========================================
// FARMER GROUPS SERVICES
// ==========================================

export const createGroupService = async (
  data: CreateGroupInput,
  requesterId: bigint
) => {
  const { name, purpose, cropType, areaId } = data;

  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
  });
  if (!requester) {
    throw new Error("Requester profile not found.");
  }

  const group = await prisma.farmerGroup.create({
    data: {
      name,
      purpose: purpose || null,
      cropType: cropType || null,
      areaId: areaId ? BigInt(areaId) : null,
      createdByAdminId: requester.role === Role.admin ? requesterId : null,
      status: GroupStatus.active,
    },
    include: {
      area: true,
    },
  });

  // If a farmer created the group, automatically join them as leader/organizer
  if (requester.role === Role.farmer) {
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        farmerId: requesterId,
        role: GroupRole.leader,
      },
    });
  }

  return group;
};

export const listGroupsService = async (filters: { areaId?: bigint; cropType?: string }) => {
  const where: any = { status: GroupStatus.active };

  if (filters.areaId) {
    where.areaId = filters.areaId;
  }
  if (filters.cropType) {
    where.cropType = { contains: filters.cropType, mode: "insensitive" };
  }

  return await prisma.farmerGroup.findMany({
    where,
    include: {
      area: true,
      _count: { select: { members: true } },
      members: { select: { farmerId: true } },
    },
  });
};

export const joinGroupService = async (groupId: bigint, farmerId: bigint) => {
  const group = await prisma.farmerGroup.findUnique({
    where: { id: groupId },
  });
  if (!group || group.status !== GroupStatus.active) {
    throw new Error("Target Farmer Group not found or is inactive.");
  }

  // Ensure farmer exists
  const farmer = await prisma.user.findUnique({
    where: { id: farmerId },
  });
  if (!farmer || farmer.role !== Role.farmer) {
    throw new Error("Only active farmers can join farmer groups.");
  }

  // Check if already a member
  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_farmerId: { groupId, farmerId },
    },
  });
  if (existingMember) {
    throw new Error("You are already a member of this group.");
  }

  return await prisma.groupMember.create({
    data: {
      groupId,
      farmerId,
      role: GroupRole.member,
    },
    include: {
      group: true,
      farmer: { select: { id: true, name: true, phone: true } },
    },
  });
};

export const leaveGroupService = async (groupId: bigint, farmerId: bigint) => {
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_farmerId: { groupId, farmerId },
    },
  });
  if (!member) {
    throw new Error("You are not a member of this group.");
  }

  return await prisma.groupMember.delete({
    where: {
      groupId_farmerId: { groupId, farmerId },
    },
  });
};

export const listGroupMembersService = async (groupId: bigint) => {
  const group = await prisma.farmerGroup.findUnique({
    where: { id: groupId },
  });
  if (!group) {
    throw new Error("Farmer Group not found.");
  }

  return await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      farmer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
};

export const deleteGroupService = async (groupId: bigint, requesterId: bigint) => {
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
  });
  if (!requester) {
    throw new Error("Requester profile not found.");
  }

  const group = await prisma.farmerGroup.findUnique({
    where: { id: groupId },
  });
  if (!group) {
    throw new Error("Farmer Group not found.");
  }

  // Only Admin or the creator/organizer can delete the group
  if (requester.role !== Role.admin) {
    const organizer = await prisma.groupMember.findFirst({
      where: { groupId, farmerId: requesterId, role: GroupRole.leader },
    });
    if (!organizer) {
      throw new Error("Only Admins or Group Leaders are authorized to delete groups.");
    }
  }

  return await prisma.farmerGroup.update({
    where: { id: groupId },
    data: { status: GroupStatus.inactive }, // Soft delete
  });
};
