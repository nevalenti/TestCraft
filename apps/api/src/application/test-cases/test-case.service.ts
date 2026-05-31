import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateTestCase,
  ITestCaseRepository,
  UpdateTestCase,
} from "@/application/test-cases/test-case.repository";
import { TestCase } from "@/domain/test-case";

export interface ITestCaseService {
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
  create(suiteId: string, dto: CreateTestCase): Promise<TestCase>;
  update(
    suiteId: string,
    id: string,
    dto: UpdateTestCase,
  ): Promise<TestCase | null>;
  delete(suiteId: string, id: string): Promise<boolean>;
}

export class TestCaseService implements ITestCaseService {
  constructor(private readonly repo: ITestCaseRepository) {}

  getAll(suiteId: string, search?: string, pagination?: PaginationParams) {
    return this.repo.getAll(suiteId, search, pagination);
  }

  getAllByProject(
    projectId: string,
    search?: string,
    pagination?: PaginationParams,
  ) {
    return this.repo.getAllByProject(projectId, search, pagination);
  }

  getById(suiteId: string, id: string) {
    return this.repo.getById(suiteId, id);
  }

  create(suiteId: string, dto: CreateTestCase) {
    return this.repo.create(suiteId, dto);
  }

  update(suiteId: string, id: string, dto: UpdateTestCase) {
    return this.repo.update(suiteId, id, dto);
  }

  delete(suiteId: string, id: string) {
    return this.repo.delete(suiteId, id);
  }
}
