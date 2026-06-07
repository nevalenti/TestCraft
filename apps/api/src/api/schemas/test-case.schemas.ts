import { TestCasePriority } from "@testcraft/types";
import { z } from "zod";

import { paginationSchema } from "@/api/schemas/pagination.schemas";

export const testCaseQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const createTestCaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
  priority: z
    .nativeEnum(TestCasePriority)
    .optional()
    .default(TestCasePriority.Medium),
});

export const updateTestCaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
  priority: z.nativeEnum(TestCasePriority),
});
