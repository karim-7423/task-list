import { z } from "zod";

export const subtaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  completed: z.boolean().optional(),
  order: z.number().int().min(0).optional()
});

export const subtaskUpdateSchema = subtaskSchema.partial();
