import { z } from "zod";
import { ListingStatus, MatchStatus } from "../../generated/prisma/client.js";
// Buyer validation
export const createBuyerSchema = z.object({
    name: z.string().min(1, "Name is required").max(150),
    phone: z.string().max(15).optional(),
    companyName: z.string().max(200).optional(),
    gstNo: z.string().max(30).optional(),
    preferredCrops: z.string().max(255).optional(),
    areaId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]).optional(),
});
export const updateBuyerSchema = createBuyerSchema.partial();
// Matchmaking validation
export const createMatchSchema = z.object({
    cropListingId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
    buyerId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
    offeredPrice: z.number().positive("Price must be a positive number").optional(),
});
export const updateMatchStatusSchema = z.object({
    status: z.nativeEnum(MatchStatus),
    offeredPrice: z.number().positive("Price must be a positive number").optional(),
});
// Listing validation
export const updateListingSchema = z.object({
    status: z.nativeEnum(ListingStatus).optional(),
    askingPrice: z.number().positive("Price must be a positive number").optional(),
});
