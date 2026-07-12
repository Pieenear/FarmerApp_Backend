import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(200),
  purpose: z.string().max(255).optional(),
  cropType: z.string().max(150).optional(),
  areaId: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(v => Number(v))]).optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
