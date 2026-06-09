import type { TestRunStatus } from "./enums.js";

export interface TestRun {
  id: string;
  projectId: string;
  name: string;
  environment: string;
  status: TestRunStatus;
  source?: string;
  executedById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestRun {
  name: string;
  environment: string;
  status?: TestRunStatus;
}

export interface UpdateTestRun {
  name: string;
  environment: string;
  status: TestRunStatus;
}

export interface TestRunSummary {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  passRate: number;
}
