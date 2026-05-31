import { TestResultStatus } from "@testcraft/types";

export interface TestResult {
  id: string;
  testRunId: string;
  testCaseId: string;
  suiteId: string;
  testCaseName: string;
  status: TestResultStatus;
  notes: string | null;
  executedAt: Date;
  executedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}
