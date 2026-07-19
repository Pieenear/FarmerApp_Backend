import { z } from "zod";
import { ContentCategory, ContentStatus } from "../../generated/prisma/client.js";
export const createContentSchema = z.object({
    title: z.string().min(1, "Title is required").max(1000),
    titleMr: z.string().optional(),
    content: z.string().min(1, "Content is required"),
    contentMr: z.string().optional(),
    category: z.nativeEnum(ContentCategory),
    imageUrl: z.string().max(255).optional(),
    areaId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]).optional(),
    status: z.nativeEnum(ContentStatus).optional().default(ContentStatus.draft),
});
export const updateContentSchema = createContentSchema.partial();
