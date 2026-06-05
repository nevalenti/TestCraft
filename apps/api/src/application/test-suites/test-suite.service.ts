import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateTestSuite,
  ITestSuiteRepository,
  UpdateTestSuite,
} from "@/application/test-suites/test-suite.repository";
import { TestSuite } from "@/domain/test-suite";

export interface ITestSuiteService {
  getAll(
    projectId: string,
    pagination?: PaginationParams,
    search?: string,
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

export class TestSuiteService implements ITestSuiteService {
  constructor(private readonly testSuiteRepository: ITestSuiteRepository) {}

  getAll(projectId: string, pagination?: PaginationParams, search?: string) {
    return this.testSuiteRepository.getAll(projectId, pagination, search);
  }

  getById(projectId: string, id: string) {
    return this.testSuiteRepository.getById(projectId, id);
  }

  create(projectId: string, input: CreateTestSuite) {
    return this.testSuiteRepository.create(projectId, input);
  }

  update(projectId: string, id: string, input: UpdateTestSuite) {
    return this.testSuiteRepository.update(projectId, id, input);
  }

  delete(projectId: string, id: string) {
    return this.testSuiteRepository.delete(projectId, id);
  }
}
