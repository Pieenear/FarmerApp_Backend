import { z } from "zod";
import { AvailabilityStatus, StaffSpecialization } from "../../generated/prisma/client.js";

export const createStaffSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  areaId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
  specialization: z.nativeEnum(StaffSpecialization).optional().nullable(),
  availabilityStatus: z.nativeEnum(AvailabilityStatus).optional().default(AvailabilityStatus.available),
});

export const updateStaffSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  phone: z.string().min(10).max(15).optional(),
  areaId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]).optional(),
  specialization: z.nativeEnum(StaffSpecialization).optional().nullable(),
  availabilityStatus: z.nativeEnum(AvailabilityStatus).optional(),
});

export const assignRequestSchema = z.object({
  requestId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
  staffId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type AssignRequestInput = z.infer<typeof assignRequestSchema>;
