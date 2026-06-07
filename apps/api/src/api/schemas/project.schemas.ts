import { z } from "zod";

import { paginationSchema } from "@/api/schemas/pagination.schemas";

export const projectQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
});
