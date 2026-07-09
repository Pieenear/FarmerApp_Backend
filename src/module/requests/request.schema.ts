import { z } from "zod";
import { RequestType, RequestStatus } from "../../generated/prisma/client.js";

// 1. Soil Test Detail Schema
export const soilTestDetailSchema = z.object({
  sampleLocation: z.string().max(255).optional().nullable(),
  landAreaAcres: z.union([z.number(), z.string().transform(v => Number(v))]).optional().nullable(),
  previousCrop: z.string().max(150).optional().nullable(),
});

// 2. Water Test Detail Schema
export const waterTestDetailSchema = z.object({
  waterSource: z.string().max(50).optional().nullable(), // borewell, canal, river, pond, other
  sampleLocation: z.string().max(255).optional().nullable(),
});

// 3. Labour Request Detail Schema
export const labourRequestDetailSchema = z.object({
  labourType: z.string().max(100).optional().nullable(),
  numLabourersNeeded: z.union([z.number().int(), z.string().transform(v => parseInt(v, 10))]).optional().nullable(),
  workStartDate: z.string().transform(v => new Date(v)).optional().nullable(),
  durationDays: z.union([z.number().int(), z.string().transform(v => parseInt(v, 10))]).optional().nullable(),
});

// 4. Equipment Request Detail Schema
export const equipmentRequestDetailSchema = z.object({
  equipmentType: z.string().max(150).optional().nullable(),
  quantity: z.union([z.number().int(), z.string().transform(v => parseInt(v, 10))]).default(1).optional().nullable(),
  rentalDurationDays: z.union([z.number().int(), z.string().transform(v => parseInt(v, 10))]).optional().nullable(),
  preferredDate: z.string().transform(v => new Date(v)).optional().nullable(),
});

// 5. Fertilizer Request Detail Schema
export const fertilizerRequestDetailSchema = z.object({
  fertilizerType: z.string().max(150).optional().nullable(),
  quantityKg: z.union([z.number(), z.string().transform(v => Number(v))]).optional().nullable(),
  cropType: z.string().max(150).optional().nullable(),
});

// 6. Pesticide Request Detail Schema
export const pesticideRequestDetailSchema = z.object({
  pesticideType: z.string().max(150).optional().nullable(),
  quantityNeeded: z.union([z.number(), z.string().transform(v => Number(v))]).optional().nullable(),
  pestIssueDescription: z.string().optional().nullable(),
});

// 7. Storage Request Detail Schema
export const storageRequestDetailSchema = z.object({
  cropType: z.string().max(150).optional().nullable(),
  quantityKg: z.union([z.number(), z.string().transform(v => Number(v))]).optional().nullable(),
  storageDurationDays: z.union([z.number().int(), z.string().transform(v => parseInt(v, 10))]).optional().nullable(),
  preferredStartDate: z.string().transform(v => new Date(v)).optional().nullable(),
});

// 8. Group Forming Request Detail Schema
export const groupFormingRequestDetailSchema = z.object({
  purpose: z.string().max(255).optional().nullable(),
  cropType: z.string().max(150).optional().nullable(),
  minMembers: z.union([z.number().int(), z.string().transform(v => parseInt(v, 10))]).optional().nullable(),
});

// 9. Crop Selling Request Detail Schema
export const cropSellingRequestDetailSchema = z.object({
  cropType: z.string().max(150).optional().nullable(),
  quantityKg: z.union([z.number(), z.string().transform(v => Number(v))]).optional().nullable(),
  expectedPrice: z.union([z.number(), z.string().transform(v => Number(v))]).optional().nullable(),
  harvestDate: z.string().transform(v => new Date(v)).optional().nullable(),
});

// Discriminated union of raise request schemas
export const raiseRequestSchema = z.discriminatedUnion("requestType", [
  z.object({
    requestType: z.literal(RequestType.soil_testing),
    description: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
    details: soilTestDetailSchema,
  }),
  z.object({
    requestType: z.literal(RequestType.water_testing),
    description: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
    details: waterTestDetailSchema,
  }),
  z.object({
    requestType: z.literal(RequestType.labour_management),
    description: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
    details: labourRequestDetailSchema,
  }),
  z.object({
    requestType: z.literal(RequestType.farming_equipment),
    description: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
    details: equipmentRequestDetailSchema,
  }),
  z.object({
    requestType: z.literal(RequestType.fertilizer_management),
    description: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
    details: fertilizerRequestDetailSchema,
  }),
  z.object({
    requestType: z.literal(RequestType.pesticide_management),
    description: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
    details: pesticideRequestDetailSchema,
  }),
  z.object({
    requestType: z.literal(RequestType.storage_request),
    description: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
    details: storageRequestDetailSchema,
  }),
  z.object({
    requestType: z.literal(RequestType.group_forming),
    description: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
    details: groupFormingRequestDetailSchema,
  }),
  z.object({
    requestType: z.literal(RequestType.crop_selling),
    description: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
    details: cropSellingRequestDetailSchema,
  }),
]);

// Admin request fulfillment / status update schema
export const updateRequestStatusSchema = z.object({
  status: z.nativeEnum(RequestStatus),
  remarks: z.string().max(1000).optional().nullable(),
  scheduledDate: z.string().transform(v => new Date(v)).optional().nullable(),
});

export type RaiseRequestInput = z.infer<typeof raiseRequestSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
export type SoilTestDetailInput = z.infer<typeof soilTestDetailSchema>;
export type WaterTestDetailInput = z.infer<typeof waterTestDetailSchema>;
export type LabourRequestDetailInput = z.infer<typeof labourRequestDetailSchema>;
export type EquipmentRequestDetailInput = z.infer<typeof equipmentRequestDetailSchema>;
export type FertilizerRequestDetailInput = z.infer<typeof fertilizerRequestDetailSchema>;
export type PesticideRequestDetailInput = z.infer<typeof pesticideRequestDetailSchema>;
export type StorageRequestDetailInput = z.infer<typeof storageRequestDetailSchema>;
export type GroupFormingRequestDetailInput = z.infer<typeof groupFormingRequestDetailSchema>;
export type CropSellingRequestDetailInput = z.infer<typeof cropSellingRequestDetailSchema>;
