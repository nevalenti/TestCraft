import { TestRunStatus } from "@testcraft/types";

import type { TestRun } from "@/domain/test-run";

export const runSelect = {
  id: true,
  projectId: true,
  name: true,
  environment: true,
  status: true,
  source: true,
  executedById: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const toTestRun = (run: {
  id: string;
  projectId: string;
  name: string;
  environment: string;
  status: string;
  source: string | null;
  executedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TestRun => ({ ...run, status: run.status as TestRunStatus });
