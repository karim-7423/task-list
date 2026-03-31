import { z } from "zod";
import type { Priority } from "../lib/db.js";

const dateSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.literal(""))
  .nullable()
  .transform((value) => (value ? value : null));

export const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"] satisfies [Priority, ...Priority[]]);

export const taskQuerySchema = z.object({
  status: z.enum(["all", "active", "completed"]).default("all"),
  priority: prioritySchema.optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt")
});

export const taskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  completed: z.boolean().optional(),
  priority: prioritySchema.default("MEDIUM"),
  dueDate: dateSchema.optional(),
  categoryId: z.string().uuid().nullable().optional()
});

export const taskUpdateSchema = taskSchema.partial();
