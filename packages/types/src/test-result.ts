import type { TestResultStatus } from "./enums.js";

export interface TestResult {
  id: string;
  testRunId: string;
  testCaseId: string;
  suiteId: string;
  testCaseName: string;
  status: TestResultStatus;
  notes?: string;
  executedAt: string;
  executedById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestResultInput {
  testCaseId: string;
  status: TestResultStatus;
  notes?: string;
  executedAt: string;
}

export interface UpdateTestResultInput {
  status: TestResultStatus;
  notes?: string;
}
