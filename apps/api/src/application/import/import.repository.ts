import type { TestResultStatus, TestRunStatus } from "@testcraft/types";

import type { TestRun } from "@/domain/test-run";

export interface ParsedStep {
  order: number;
  action: string;
  expectedResult: string;
}

export interface ParsedTestCase {
  suiteName: string;
  caseName: string;
  status: TestResultStatus;
  notes: string | null;
  steps?: ParsedStep[];
}

export interface IImportRepository {
  createRunWithResults(
    projectId: string,
    name: string,
    environment: string,
    status: TestRunStatus,
    cases: ParsedTestCase[],
    userId?: string,
    source?: string,
  ): Promise<TestRun>;
}
