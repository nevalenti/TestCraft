import { z } from "zod";

export const createTestCaseStepSchema = z.object({
  order: z.number().int().min(1),
  action: z.string().min(1).max(2000),
  expectedResult: z.string().min(1).max(2000),
});

export const updateTestCaseStepSchema = z.object({
  order: z.number().int().min(1),
  action: z.string().min(1).max(2000),
  expectedResult: z.string().min(1).max(2000),
});

export const bulkReorderStepsSchema = z.object({
  steps: z
    .array(
      z.object({
        id: z.string().uuid(),
        order: z.number().int().min(1),
      }),
    )
    .min(1)
    .refine((steps) => new Set(steps.map((s) => s.id)).size === steps.length, {
      message: "Duplicate step IDs are not allowed",
    }),
});
