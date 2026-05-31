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
  create(suiteId: string, input: CreateTestCase): Promise<TestCase>;
  update(
    suiteId: string,
    id: string,
    input: UpdateTestCase,
  ): Promise<TestCase | null>;
  delete(suiteId: string, id: string): Promise<boolean>;
}

export class TestCaseService implements ITestCaseService {
  constructor(private readonly testCaseRepository: ITestCaseRepository) {}

  getAll(suiteId: string, search?: string, pagination?: PaginationParams) {
    return this.testCaseRepository.getAll(suiteId, search, pagination);
  }

  getAllByProject(
    projectId: string,
    search?: string,
    pagination?: PaginationParams,
  ) {
    return this.testCaseRepository.getAllByProject(
      projectId,
      search,
      pagination,
    );
  }

  getById(suiteId: string, id: string) {
    return this.testCaseRepository.getById(suiteId, id);
  }

  create(suiteId: string, input: CreateTestCase) {
    return this.testCaseRepository.create(suiteId, input);
  }

  update(suiteId: string, id: string, input: UpdateTestCase) {
    return this.testCaseRepository.update(suiteId, id, input);
  }

  delete(suiteId: string, id: string) {
    return this.testCaseRepository.delete(suiteId, id);
  }
}
