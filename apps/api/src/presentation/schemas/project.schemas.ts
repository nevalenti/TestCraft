import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
});
