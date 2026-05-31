import { Paginated, PaginationParams } from "@testcraft/types";

import { TestSuite } from "@/domain/test-suite";

export interface CreateTestSuite {
  name: string;
  description?: string | null;
}

export type UpdateTestSuite = CreateTestSuite;

export interface ITestSuiteRepository {
  getAll(
    projectId: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestSuite>>;
  getById(projectId: string, id: string): Promise<TestSuite | null>;
  create(projectId: string, input: CreateTestSuite): Promise<TestSuite>;
  update(
    projectId: string,
    id: string,
    input: UpdateTestSuite,
  ): Promise<TestSuite | null>;
  delete(projectId: string, id: string): Promise<boolean>;
}
