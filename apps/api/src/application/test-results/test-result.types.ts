import { TestResultStatus } from "@testcraft/types";

export interface CreateTestResult {
  testCaseId: string;
  status: TestResultStatus;
  notes?: string | null;
  executedAt: Date;
}

export interface UpdateTestResult {
  status: TestResultStatus;
  notes?: string | null;
}
