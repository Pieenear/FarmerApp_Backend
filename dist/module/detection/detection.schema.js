import { z } from "zod";
export const createDetectionLogSchema = z.object({
    farmerId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]).optional(),
    imageUrl: z.string().url("Image URL must be a valid URL").max(255),
    detectedDisease: z.string().max(200).optional(),
    confidenceScore: z.number().min(0).max(100).optional(),
    recommendation: z.string().optional(),
    cropType: z.string().max(150).optional(),
});
export const updateDetectionLogSchema = createDetectionLogSchema.partial();
