import { z } from "zod";

import { paginationSchema } from "@/api/schemas/pagination.schemas";

export const testSuiteQuerySchema = paginationSchema.extend({
  search: z.string().max(255).optional(),
});

export const createTestSuiteSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
});

export const updateTestSuiteSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
});
