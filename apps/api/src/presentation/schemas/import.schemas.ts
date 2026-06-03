import { z } from "zod";

export const importJunitSchema = z.object({
  xml: z.string().min(1, "XML content is required").max(4_500_000),
  environment: z.string().min(1, "Environment is required").max(255),
  name: z.string().min(1).max(255).optional(),
});

const allureResultSchema = z.object({
  name: z.string().optional(),
  fullName: z.string().optional(),
  status: z
    .enum(["passed", "failed", "broken", "skipped", "unknown"])
    .optional(),
  statusDetails: z
    .object({ message: z.string().optional(), trace: z.string().optional() })
    .optional(),
  labels: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
});

export const importAllureSchema = z.object({
  results: z
    .array(allureResultSchema)
    .min(1, "At least one result is required")
    .max(10_000, "Too many results — split into smaller batches"),
  environment: z.string().min(1, "Environment is required").max(255),
  name: z.string().min(1).max(255).optional(),
});
