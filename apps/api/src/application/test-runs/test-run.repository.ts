import {
  Paginated,
  PaginationParams,
  TestRunStatus,
  TestRunSummary,
} from "@testcraft/types";

import { TestRun } from "@/domain/test-run";

export interface CreateTestRun {
  name: string;
  environment: string;
  status: TestRunStatus;
}

export type UpdateTestRun = CreateTestRun;

export interface ITestRunRepository {
  findById(id: string): Promise<TestRun | null>;
  getAll(
    projectId: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestRun>>;
  getById(projectId: string, id: string): Promise<TestRun | null>;
  getSummary(projectId: string, id: string): Promise<TestRunSummary | null>;
  create(projectId: string, input: CreateTestRun): Promise<TestRun>;
  update(
    projectId: string,
    id: string,
    input: UpdateTestRun,
  ): Promise<TestRun | null>;
  delete(projectId: string, id: string): Promise<boolean>;
}
