import { z } from "zod";
export const farmerSignupSchema = z.object({
    phone: z.string().min(10, "Phone number must be at least 10 characters").max(15),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name must be at least 2 characters").max(150),
    areaId: z
        .union([z.number().int(), z.string().regex(/^\d+$/).transform(val => Number(val))])
        .optional()
        .nullable(),
    languagePref: z.string().optional().default("en"),
    farmSizeAcres: z
        .union([z.number(), z.string().transform(val => Number(val))])
        .optional()
        .nullable(),
    landLocation: z.string().max(255).optional().nullable(),
    primaryCrops: z.string().max(255).optional().nullable(),
    landSurveyNo: z.string().max(100).optional().nullable(),
});
export const adminSignupSchema = z.object({
    phone: z.string().min(10, "Phone number must be at least 10 characters").max(15),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name must be at least 2 characters").max(150),
    email: z.string().email("Invalid email format").optional().nullable(),
    secret: z.string().min(1, "Admin secret is required"),
});
export const loginSchema = z.object({
    phone: z.string().min(10, "Phone number must be at least 10 characters").max(15),
    password: z.string().min(1, "Password is required"),
});
