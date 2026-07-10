import { z } from "zod";
import { ReportType } from "../../generated/prisma/client.js";

export const uploadReportSchema = z.object({
  requestId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
  reportType: z.nativeEnum(ReportType),
  rawFileUrl: z.string().url("Must be a valid URL"),
  simplified: z.object({
    summaryText: z.string().optional(),
    healthScore: z.number().min(0).max(100).optional(),
    keyParameters: z.record(z.string(), z.any()).optional(),
    recommendations: z.string().optional(),
    language: z.string().optional().default("en"),
  }).optional(),
});

export const addSimplifiedReportSchema = z.object({
  summaryText: z.string().min(1, "Summary is required"),
  healthScore: z.number().min(0).max(100).optional(),
  keyParameters: z.record(z.string(), z.any()).optional(),
  recommendations: z.string().optional(),
  language: z.string().optional().default("en"),
});

export type UploadReportInput = z.infer<typeof uploadReportSchema>;
export type AddSimplifiedReportInput = z.infer<typeof addSimplifiedReportSchema>;
