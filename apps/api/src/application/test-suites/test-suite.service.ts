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
  ): Promise<Paginated<TestSuite>>;
  getById(projectId: string, id: string): Promise<TestSuite | null>;
  create(projectId: string, dto: CreateTestSuite): Promise<TestSuite>;
  update(
    projectId: string,
    id: string,
    dto: UpdateTestSuite,
  ): Promise<TestSuite | null>;
  delete(projectId: string, id: string): Promise<boolean>;
}

export class TestSuiteService implements ITestSuiteService {
  constructor(private readonly repo: ITestSuiteRepository) {}

  getAll(projectId: string, pagination?: PaginationParams) {
    return this.repo.getAll(projectId, pagination);
  }

  getById(projectId: string, id: string) {
    return this.repo.getById(projectId, id);
  }

  create(projectId: string, dto: CreateTestSuite) {
    return this.repo.create(projectId, dto);
  }

  update(projectId: string, id: string, dto: UpdateTestSuite) {
    return this.repo.update(projectId, id, dto);
  }

  delete(projectId: string, id: string) {
    return this.repo.delete(projectId, id);
  }
}
