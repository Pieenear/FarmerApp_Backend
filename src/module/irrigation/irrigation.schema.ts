import { z } from "zod";
import { DayOfWeek } from "../../generated/prisma/client.js";

const timeStringRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

// Light Schedule validation
export const createLightScheduleSchema = z.object({
  areaId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string().regex(timeStringRegex, "Start time must be in HH:MM or HH:MM:SS format"),
  endTime: z.string().regex(timeStringRegex, "End time must be in HH:MM or HH:MM:SS format"),
});

export const updateLightScheduleSchema = createLightScheduleSchema.partial();

// MCB Contact validation
export const createMcbContactSchema = z.object({
  areaId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
  contactName: z.string().max(150).optional(),
  designation: z.string().max(100).optional(),
  phoneNumber: z.string().max(15).optional(),
});

export const updateMcbContactSchema = createMcbContactSchema.partial();

export type CreateLightScheduleInput = z.infer<typeof createLightScheduleSchema>;
export type UpdateLightScheduleInput = z.infer<typeof updateLightScheduleSchema>;
export type CreateMcbContactInput = z.infer<typeof createMcbContactSchema>;
export type UpdateMcbContactInput = z.infer<typeof updateMcbContactSchema>;

// Irrigation Recommendation validation
export const createRecommendationSchema = z.object({
  farmerId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
  areaId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]).optional(),
  cropType: z.string().max(150).optional(),
  recommendationText: z.string().optional(),
  waterAmountLiters: z.number().min(0).optional(),
  recommendedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Recommended date must be YYYY-MM-DD").optional().transform(v => v ? new Date(v) : undefined),
});

export type CreateRecommendationInput = z.infer<typeof createRecommendationSchema>;

