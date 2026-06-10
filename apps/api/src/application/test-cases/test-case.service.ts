import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateTestCase,
  ITestCaseRepository,
  UpdateTestCase,
} from "@/application/test-cases/test-case.repository";
import { NotFoundError } from "@/domain/errors";
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
  getById(suiteId: string, id: string): Promise<TestCase>;
  create(suiteId: string, input: CreateTestCase): Promise<TestCase>;
  update(suiteId: string, id: string, input: UpdateTestCase): Promise<TestCase>;
  delete(suiteId: string, id: string): Promise<void>;
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

  async getById(suiteId: string, id: string): Promise<TestCase> {
    const testCase = await this.testCaseRepository.getById(suiteId, id);

    if (!testCase) throw new NotFoundError();

    return testCase;
  }

  create(suiteId: string, input: CreateTestCase) {
    return this.testCaseRepository.create(suiteId, input);
  }

  async update(
    suiteId: string,
    id: string,
    input: UpdateTestCase,
  ): Promise<TestCase> {
    const testCase = await this.testCaseRepository.update(suiteId, id, input);

    if (!testCase) throw new NotFoundError();

    return testCase;
  }

  async delete(suiteId: string, id: string): Promise<void> {
    const deleted = await this.testCaseRepository.delete(suiteId, id);

    if (!deleted) throw new NotFoundError();
  }
}
