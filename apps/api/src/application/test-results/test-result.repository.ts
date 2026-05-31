import { Paginated, PaginationParams, TestResultStatus } from "@testcraft/types";

import { TestResult } from "@/domain/test-result";

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

export interface ITestResultRepository {
  getAll(
    runId: string,
    status?: TestResultStatus,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestResult>>;
  getById(runId: string, id: string): Promise<TestResult | null>;
  create(
    runId: string,
    input: CreateTestResult,
    userId?: string,
  ): Promise<TestResult>;
  update(
    runId: string,
    id: string,
    input: UpdateTestResult,
  ): Promise<TestResult | null>;
  delete(runId: string, id: string): Promise<boolean>;
}
