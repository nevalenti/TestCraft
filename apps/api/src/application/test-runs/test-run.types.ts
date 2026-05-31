import { TestRunStatus } from "@testcraft/types";

export interface CreateTestRun {
  name: string;
  environment: string;
  status: TestRunStatus;
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
