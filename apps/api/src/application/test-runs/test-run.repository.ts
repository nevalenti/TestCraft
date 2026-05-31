import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateTestRun,
  TestRunSummary,
  UpdateTestRun,
} from "@/application/test-runs/test-run.types";
import { TestRun } from "@/domain/test-run";

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
