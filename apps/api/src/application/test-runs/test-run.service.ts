import { Paginated, PaginationParams, TestRunSummary } from "@testcraft/types";

import {
  CreateTestRun,
  ITestRunRepository,
  UpdateTestRun,
} from "@/application/test-runs/test-run.repository";
import { DomainError } from "@/domain/errors";
import { canTransitionRunStatus } from "@/domain/rules";
import { TestRun } from "@/domain/test-run";
import { CacheService } from "@/infrastructure/cache/cache.service";
import { cacheKeys } from "@/infrastructure/cache/cache-keys";

export interface ITestRunService {
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

export class TestRunService implements ITestRunService {
  constructor(
    private readonly testRunRepository: ITestRunRepository,
    private readonly cache: CacheService,
  ) {}

  getAll(projectId: string, pagination?: PaginationParams) {
    return this.testRunRepository.getAll(projectId, pagination);
  }

  getById(projectId: string, id: string) {
    return this.testRunRepository.getById(projectId, id);
  }

  async getSummary(
    projectId: string,
    id: string,
  ): Promise<TestRunSummary | null> {
    const key = cacheKeys.testRunSummary(id);
    const cached = await this.cache.get<TestRunSummary>(key);
    if (cached) return cached;

    const summary = await this.testRunRepository.getSummary(projectId, id);
    if (summary) await this.cache.set(key, summary);
    return summary;
  }

  create(projectId: string, input: CreateTestRun) {
    return this.testRunRepository.create(projectId, input);
  }

  async update(
    projectId: string,
    id: string,
    input: UpdateTestRun,
  ): Promise<TestRun | null> {
    const current = await this.testRunRepository.getById(projectId, id);
    if (!current) return null;

    if (!canTransitionRunStatus(current.status, input.status)) {
      throw new DomainError(
        `Cannot transition run status from ${current.status} to ${input.status}`,
      );
    }

    const updated = await this.testRunRepository.update(projectId, id, input);
    if (updated) await this.cache.del(cacheKeys.testRunSummary(id));
    return updated;
  }

  async delete(projectId: string, id: string) {
    const deleted = await this.testRunRepository.delete(projectId, id);
    if (deleted) await this.cache.del(cacheKeys.testRunSummary(id));
    return deleted;
  }
}
