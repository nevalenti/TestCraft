import { TestResultStatus } from "@testcraft/types";
import { z } from "zod";

import { paginationSchema } from "@/presentation/schemas/pagination.schemas";

export const testResultQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(TestResultStatus).optional(),
  search: z.string().max(255).optional(),
});

export const createTestResultSchema = z.object({
  testCaseId: z.string().uuid(),
  status: z.nativeEnum(TestResultStatus),
  notes: z.string().max(5000).nullable().optional(),
  executedAt: z.coerce.date(),
});

export const updateTestResultSchema = z.object({
  status: z.nativeEnum(TestResultStatus),
  notes: z.string().max(5000).nullable().optional(),
});
