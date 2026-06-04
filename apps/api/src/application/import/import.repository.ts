import type { TestResultStatus, TestRunStatus } from "@testcraft/types";

import type { TestRun } from "@/domain/test-run";

export interface ParsedTestCase {
  suiteName: string;
  caseName: string;
  status: TestResultStatus;
  notes: string | null;
}

export interface IImportRepository {
  createRunWithResults(
    projectId: string,
    name: string,
    environment: string,
    status: TestRunStatus,
    cases: ParsedTestCase[],
    userId: string | undefined,
  ): Promise<TestRun>;
}
