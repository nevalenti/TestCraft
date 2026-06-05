import { TestRunStatus } from "@testcraft/types";
import { z } from "zod";

import { paginationSchema } from "@/presentation/schemas/pagination.schemas";

export const testRunQuerySchema = paginationSchema.extend({
  search: z.string().max(255).optional(),
});

export const createTestRunSchema = z.object({
  name: z.string().min(1).max(255),
  environment: z.string().min(1).max(255),
  status: z.nativeEnum(TestRunStatus).optional().default(TestRunStatus.Active),
});

export const updateTestRunSchema = z.object({
  name: z.string().min(1).max(255),
  environment: z.string().min(1).max(255),
  status: z.nativeEnum(TestRunStatus),
});
