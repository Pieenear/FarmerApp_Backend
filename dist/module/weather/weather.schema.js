import { z } from "zod";
import { Severity } from "../../generated/prisma/client.js";
export const createWeatherAlertSchema = z.object({
    areaId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
    alertType: z.string().min(1, "Alert type is required").max(100),
    message: z.string().min(1, "Alert message is required"),
    severity: z.nativeEnum(Severity).default(Severity.medium),
    validFrom: z.string().datetime({ precision: 3 }).or(z.string().date()).optional(),
    validTo: z.string().datetime({ precision: 3 }).or(z.string().date()).optional(),
    source: z.string().max(100).optional(),
});
export const updateWeatherAlertSchema = createWeatherAlertSchema.partial();
