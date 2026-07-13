import { prisma } from "../../lib/prisma.js";
import { DayOfWeek } from "../../generated/prisma/client.js";
import {
  CreateLightScheduleInput,
  UpdateLightScheduleInput,
  CreateMcbContactInput,
  UpdateMcbContactInput,
  CreateRecommendationInput,
} from "./irrigation.schema.js";
import { Role, Prisma } from "../../generated/prisma/client.js";
import { translateText } from "../../lib/translator.js";

// Helper utility to parse time string "HH:MM:SS" or "HH:MM" into a JavaScript Date object
export const parseTimeToDate = (timeStr: string): Date => {
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
  
  // Return Date object with fixed date parts; Prisma db.Time extracts only the time components
  return new Date(1970, 0, 1, hours, minutes, seconds);
};

// ==========================================
// 1. LIGHT SCHEDULE SERVICES
// ==========================================

export const createLightScheduleService = async (data: CreateLightScheduleInput, adminId: bigint) => {
  const { areaId, dayOfWeek, startTime, endTime } = data;

  const area = await prisma.area.findUnique({
    where: { id: BigInt(areaId) },
  });
  if (!area) {
    throw new Error("Area not found.");
  }

  return await prisma.lightSchedule.create({
    data: {
      areaId: BigInt(areaId),
      dayOfWeek,
      startTime: parseTimeToDate(startTime),
      endTime: parseTimeToDate(endTime),
      uploadedByAdminId: adminId,
    },
    include: {
      area: true,
    },
  });
};

export const listLightSchedulesService = async (filters: { areaId?: bigint }) => {
  return await prisma.lightSchedule.findMany({
    where: {
      areaId: filters.areaId ? BigInt(filters.areaId) : undefined,
    },
    include: {
      area: true,
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" },
    ],
  });
};

export const getLightScheduleByIdService = async (id: bigint) => {
  const schedule = await prisma.lightSchedule.findUnique({
    where: { id },
    include: {
      area: true,
      uploadedByAdmin: { select: { id: true, name: true } },
    },
  });

  if (!schedule) {
    throw new Error("Light schedule not found.");
  }
  return schedule;
};

export const updateLightScheduleService = async (id: bigint, data: UpdateLightScheduleInput) => {
  const { areaId, dayOfWeek, startTime, endTime } = data;

  const existing = await prisma.lightSchedule.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error("Light schedule not found.");
  }

  if (areaId !== undefined) {
    const area = await prisma.area.findUnique({
      where: { id: BigInt(areaId) },
    });
    if (!area) {
      throw new Error("Area not found.");
    }
  }

  return await prisma.lightSchedule.update({
    where: { id },
    data: {
      areaId: areaId !== undefined ? BigInt(areaId) : undefined,
      dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : undefined,
      startTime: startTime !== undefined ? parseTimeToDate(startTime) : undefined,
      endTime: endTime !== undefined ? parseTimeToDate(endTime) : undefined,
    },
    include: {
      area: true,
    },
  });
};

export const deleteLightScheduleService = async (id: bigint) => {
  const existing = await prisma.lightSchedule.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error("Light schedule not found.");
  }

  return await prisma.lightSchedule.delete({
    where: { id },
  });
};

// ==========================================
// 2. MCB UTILITY CONTACT SERVICES
// ==========================================

export const createMcbContactService = async (data: CreateMcbContactInput) => {
  const { areaId, contactName, designation, phoneNumber } = data;

  const area = await prisma.area.findUnique({
    where: { id: BigInt(areaId) },
  });
  if (!area) {
    throw new Error("Area not found.");
  }

  return await prisma.mcbContact.create({
    data: {
      areaId: BigInt(areaId),
      contactName: contactName || null,
      designation: designation || null,
      phoneNumber: phoneNumber || null,
    },
    include: {
      area: true,
    },
  });
};

export const listMcbContactsService = async (filters: { areaId?: bigint }) => {
  return await prisma.mcbContact.findMany({
    where: {
      areaId: filters.areaId ? BigInt(filters.areaId) : undefined,
    },
    include: {
      area: true,
    },
    orderBy: { contactName: "asc" },
  });
};

export const getMcbContactByIdService = async (id: bigint) => {
  const contact = await prisma.mcbContact.findUnique({
    where: { id },
    include: {
      area: true,
    },
  });

  if (!contact) {
    throw new Error("MCB Contact not found.");
  }
  return contact;
};

export const updateMcbContactService = async (id: bigint, data: UpdateMcbContactInput) => {
  const { areaId, contactName, designation, phoneNumber } = data;

  const existing = await prisma.mcbContact.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error("MCB Contact not found.");
  }

  if (areaId !== undefined) {
    const area = await prisma.area.findUnique({
      where: { id: BigInt(areaId) },
    });
    if (!area) {
      throw new Error("Area not found.");
    }
  }

  return await prisma.mcbContact.update({
    where: { id },
    data: {
      areaId: areaId !== undefined ? BigInt(areaId) : undefined,
      contactName: contactName !== undefined ? contactName || null : undefined,
      designation: designation !== undefined ? designation || null : undefined,
      phoneNumber: phoneNumber !== undefined ? phoneNumber || null : undefined,
    },
    include: {
      area: true,
    },
  });
};

export const deleteMcbContactService = async (id: bigint) => {
  const existing = await prisma.mcbContact.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error("MCB Contact not found.");
  }

  return await prisma.mcbContact.delete({
    where: { id },
  });
};

// ==========================================
// 3. IRRIGATION RECOMMENDATION SERVICES
// ==========================================

export const createRecommendationService = async (data: CreateRecommendationInput) => {
  const { farmerId, areaId, cropType, recommendationText, waterAmountLiters, recommendedDate } = data;

  // Validate farmer exists
  const farmer = await prisma.user.findUnique({
    where: { id: BigInt(farmerId) },
  });
  if (!farmer || farmer.role !== Role.farmer) {
    throw new Error("Target Farmer not found.");
  }

  // Validate area if provided
  if (areaId !== undefined) {
    const area = await prisma.area.findUnique({
      where: { id: BigInt(areaId) },
    });
    if (!area) {
      throw new Error("Area not found.");
    }
  }

  let dbRecText = recommendationText;
  if (recommendationText) {
    const marathiMsg = await translateText(recommendationText, "mr");
    dbRecText = JSON.stringify({ en: recommendationText, mr: marathiMsg });
  }

  return await prisma.irrigationRecommendation.create({
    data: {
      farmerId: BigInt(farmerId),
      areaId: areaId !== undefined ? BigInt(areaId) : null,
      cropType: cropType || null,
      recommendationText: dbRecText || null,
      waterAmountLiters: waterAmountLiters !== undefined ? new Prisma.Decimal(waterAmountLiters) : null,
      recommendedDate: recommendedDate || null,
    },
    include: {
      farmer: { select: { id: true, name: true } },
      area: true,
    },
  });
};

export const listRecommendationsService = async (filters: {
  role: Role;
  requesterId: bigint;
  farmerId?: bigint;
}) => {
  const where: any = {};

  if (filters.role === Role.farmer) {
    where.farmerId = filters.requesterId;
  } else {
    if (filters.farmerId) {
      where.farmerId = BigInt(filters.farmerId);
    }
  }

  return await prisma.irrigationRecommendation.findMany({
    where,
    include: {
      farmer: { select: { id: true, name: true } },
      area: true,
    },
    orderBy: { generatedAt: "desc" },
  });
};
