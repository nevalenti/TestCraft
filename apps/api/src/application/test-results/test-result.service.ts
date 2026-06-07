import { Paginated, PaginationParams, TestResultStatus } from "@testcraft/types";

import {
  CreateTestResult,
  ITestResultRepository,
  UpdateTestResult,
} from "@/application/test-results/test-result.repository";
import { ITestRunRepository } from "@/application/test-runs/test-run.repository";
import { DomainError, NotFoundError } from "@/domain/errors";
import { canAddResultToRun } from "@/domain/rules";
import { TestResult } from "@/domain/test-result";
import { CacheService } from "@/infrastructure/cache/cache.service";
import { cacheKeys } from "@/infrastructure/cache/cache-keys";

export interface ITestResultService {
  getAll(
    runId: string,
    status?: TestResultStatus,
    pagination?: PaginationParams,
    search?: string,
  ): Promise<Paginated<TestResult>>;
  getById(runId: string, id: string): Promise<TestResult>;
  create(
    runId: string,
    input: CreateTestResult,
    userId?: string,
  ): Promise<TestResult>;
  update(runId: string, id: string, input: UpdateTestResult): Promise<TestResult>;
  delete(runId: string, id: string): Promise<void>;
}

export class TestResultService implements ITestResultService {
  constructor(
    private readonly testResultRepository: ITestResultRepository,
    private readonly testRunRepository: ITestRunRepository,
    private readonly cache: CacheService,
  ) {}

  private async assertRunIsModifiable(runId: string): Promise<void> {
    const run = await this.testRunRepository.findById(runId);
    if (!run) throw new NotFoundError();
    if (!canAddResultToRun(run.status)) {
      throw new DomainError(`Cannot modify results in a ${run.status} test run`);
    }
  }

  getAll(
    runId: string,
    status?: TestResultStatus,
    pagination?: PaginationParams,
    search?: string,
  ) {
    return this.testResultRepository.getAll(runId, status, pagination, search);
  }

  async getById(runId: string, id: string): Promise<TestResult> {
    const result = await this.testResultRepository.getById(runId, id);
    if (!result) throw new NotFoundError();
    return result;
  }

  async create(
    runId: string,
    input: CreateTestResult,
    userId?: string,
  ): Promise<TestResult> {
    await this.assertRunIsModifiable(runId);
    const result = await this.testResultRepository.create(runId, input, userId);
    await this.cache.del(cacheKeys.testRunSummary(runId));
    return result;
  }

  async update(
    runId: string,
    id: string,
    input: UpdateTestResult,
  ): Promise<TestResult> {
    await this.assertRunIsModifiable(runId);
    const result = await this.testResultRepository.update(runId, id, input);
    if (!result) throw new NotFoundError();
    await this.cache.del(cacheKeys.testRunSummary(runId));
    return result;
  }

  async delete(runId: string, id: string): Promise<void> {
    const deleted = await this.testResultRepository.delete(runId, id);
    if (!deleted) throw new NotFoundError();
    await this.cache.del(cacheKeys.testRunSummary(runId));
  }
}
