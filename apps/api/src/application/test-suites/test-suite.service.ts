import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateTestSuite,
  ITestSuiteRepository,
  UpdateTestSuite,
} from "@/application/test-suites/test-suite.repository";
import { NotFoundError } from "@/domain/errors";
import { TestSuite } from "@/domain/test-suite";

export interface ITestSuiteService {
  getAll(
    projectId: string,
    pagination?: PaginationParams,
    search?: string,
  ): Promise<Paginated<TestSuite>>;
  getById(projectId: string, id: string): Promise<TestSuite>;
  create(projectId: string, input: CreateTestSuite): Promise<TestSuite>;
  update(
    projectId: string,
    id: string,
    input: UpdateTestSuite,
  ): Promise<TestSuite>;
  delete(projectId: string, id: string): Promise<void>;
}

export class TestSuiteService implements ITestSuiteService {
  constructor(private readonly testSuiteRepository: ITestSuiteRepository) {}

  getAll(projectId: string, pagination?: PaginationParams, search?: string) {
    return this.testSuiteRepository.getAll(projectId, pagination, search);
  }

  async getById(projectId: string, id: string): Promise<TestSuite> {
    const suite = await this.testSuiteRepository.getById(projectId, id);
    if (!suite) throw new NotFoundError();
    return suite;
  }

  create(projectId: string, input: CreateTestSuite) {
    return this.testSuiteRepository.create(projectId, input);
  }

  async update(
    projectId: string,
    id: string,
    input: UpdateTestSuite,
  ): Promise<TestSuite> {
    const suite = await this.testSuiteRepository.update(projectId, id, input);
    if (!suite) throw new NotFoundError();
    return suite;
  }

  async delete(projectId: string, id: string): Promise<void> {
    const deleted = await this.testSuiteRepository.delete(projectId, id);
    if (!deleted) throw new NotFoundError();
  }
}
