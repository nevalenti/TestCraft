import type { DefectType, TestResultStatus } from "./enums.js";

export interface TestResult {
  id: string;
  testRunId: string;
  testCaseId: string;
  suiteId: string;
  testCaseName: string;
  status: TestResultStatus;
  notes?: string;
  durationMs?: number;
  defectType?: DefectType;
  executedAt: string;
  executedById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestResult {
  testCaseId: string;
  status: TestResultStatus;
  notes?: string;
  durationMs?: number;
  defectType?: DefectType;
  executedAt: string;
}

export interface UpdateTestResult {
  status: TestResultStatus;
  notes?: string;
  durationMs?: number;
  defectType?: DefectType;
}
