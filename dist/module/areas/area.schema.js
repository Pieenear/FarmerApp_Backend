import { z } from "zod";
export const createAreaSchema = z.object({
    name: z.string().min(1, "Area name is required").max(150, "Area name is too long"),
    taluka: z.string().max(150).optional().nullable(),
    district: z.string().max(150).optional().nullable(),
    state: z.string().max(150).optional().nullable(),
    pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits").optional().nullable(),
});
export const updateAreaSchema = createAreaSchema.partial();
