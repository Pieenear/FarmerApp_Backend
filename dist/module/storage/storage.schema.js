import { z } from "zod";
import { StorageAllocationStatus } from "../../generated/prisma/client.js";
// Storage Unit validation
export const createStorageUnitSchema = z.object({
    name: z.string().min(1, "Name is required").max(200),
    location: z.string().max(255).optional(),
    areaId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
    totalCapacityKg: z.number().positive("Total capacity must be positive"),
});
export const updateStorageUnitSchema = createStorageUnitSchema.partial();
// Storage Allocation validation
export const createAllocationSchema = z.object({
    storageUnitId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
    requestId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]),
    allocatedCapacityKg: z.number().positive("Allocated capacity must be positive"),
    startDate: z.string().datetime({ precision: 3 }).or(z.string().date()).optional(),
    endDate: z.string().datetime({ precision: 3 }).or(z.string().date()).optional(),
    status: z.nativeEnum(StorageAllocationStatus).optional().default(StorageAllocationStatus.reserved),
});
export const updateAllocationStatusSchema = z.object({
    status: z.nativeEnum(StorageAllocationStatus),
});
