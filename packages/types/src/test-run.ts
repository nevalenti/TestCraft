import type { TestRunStatus } from "./enums.js";

export interface TestRun {
  id: string;
  projectId: string;
  name: string;
  environment: string;
  status: TestRunStatus;
  executedById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestRunInput {
  name: string;
  environment: string;
  status?: TestRunStatus;
}

export interface UpdateTestRunInput {
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
