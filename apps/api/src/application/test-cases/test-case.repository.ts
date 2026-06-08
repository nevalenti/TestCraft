import {
  Paginated,
  PaginationParams,
  TestCasePriority,
} from "@testcraft/types";

import { TestCase } from "@/domain/test-case";

export interface CreateTestCase {
  name: string;
  description?: string | null;
  priority?: TestCasePriority;
}

export type UpdateTestCase = CreateTestCase;

export interface ITestCaseRepository {
  getAll(
    suiteId: string,
    search?: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestCase>>;
  getAllByProject(
    projectId: string,
    search?: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestCase>>;
  getById(suiteId: string, id: string): Promise<TestCase | null>;
  create(suiteId: string, input: CreateTestCase): Promise<TestCase>;
  update(
    suiteId: string,
    id: string,
    input: UpdateTestCase,
  ): Promise<TestCase | null>;
  delete(suiteId: string, id: string): Promise<boolean>;
}
