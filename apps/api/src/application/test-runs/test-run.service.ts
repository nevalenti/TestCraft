import { Paginated, PaginationParams } from "@testcraft/types";

import { ITestRunRepository } from "@/application/test-runs/test-run.repository";
import {
  CreateTestRun,
  TestRunSummary,
  UpdateTestRun,
} from "@/application/test-runs/test-run.types";
import { DomainError } from "@/domain/errors";
import { canTransitionRunStatus } from "@/domain/rules";
import { TestRun } from "@/domain/test-run";

export interface ITestRunService {
  getAll(
    projectId: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestRun>>;
  getById(projectId: string, id: string): Promise<TestRun | null>;
  getSummary(projectId: string, id: string): Promise<TestRunSummary | null>;
  create(projectId: string, dto: CreateTestRun): Promise<TestRun>;
  update(
    projectId: string,
    id: string,
    dto: UpdateTestRun,
  ): Promise<TestRun | null>;
  delete(projectId: string, id: string): Promise<boolean>;
}

export class TestRunService implements ITestRunService {
  constructor(private readonly testRunRepository: ITestRunRepository) {}

  getAll(projectId: string, pagination?: PaginationParams) {
    return this.testRunRepository.getAll(projectId, pagination);
  }

  getById(projectId: string, id: string) {
    return this.testRunRepository.getById(projectId, id);
  }

  getSummary(projectId: string, id: string) {
    return this.testRunRepository.getSummary(projectId, id);
  }

  create(projectId: string, dto: CreateTestRun) {
    return this.testRunRepository.create(projectId, dto);
  }

  async update(
    projectId: string,
    id: string,
    dto: UpdateTestRun,
  ): Promise<TestRun | null> {
    const current = await this.testRunRepository.getById(projectId, id);
    if (!current) return null;

    if (!canTransitionRunStatus(current.status, dto.status)) {
      throw new DomainError(
        `Cannot transition run status from ${current.status} to ${dto.status}`,
      );
    }

    return this.testRunRepository.update(projectId, id, dto);
  }

  delete(projectId: string, id: string) {
    return this.testRunRepository.delete(projectId, id);
  }
}
