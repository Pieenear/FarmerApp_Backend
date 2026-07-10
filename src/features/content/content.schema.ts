import { z } from "zod";
import { ContentCategory, ContentStatus } from "../../generated/prisma/client.js";

export const createContentSchema = z.object({
    title: z.string().min(3).max(255),
    content: z.string().min(5),
    category: z.nativeEnum(ContentCategory),
    imageUrl: z.string().url().optional().nullable(),
    areaId: z.union([
        z.number().int().positive(),
        z.string().regex(/^[0-9]+$/).transform(Number)
    ]).optional().nullable(),
    status: z.nativeEnum(ContentStatus).default(ContentStatus.published)
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
