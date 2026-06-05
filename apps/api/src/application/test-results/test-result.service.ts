import { Paginated, PaginationParams, TestResultStatus } from "@testcraft/types";

import {
  CreateTestResult,
  ITestResultRepository,
  UpdateTestResult,
} from "@/application/test-results/test-result.repository";
import { ITestRunRepository } from "@/application/test-runs/test-run.repository";
import { DomainError } from "@/domain/errors";
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
  getById(runId: string, id: string): Promise<TestResult | null>;
  create(
    runId: string,
    input: CreateTestResult,
    userId?: string,
  ): Promise<TestResult>;
  update(
    runId: string,
    id: string,
    input: UpdateTestResult,
  ): Promise<TestResult | null>;
  delete(runId: string, id: string): Promise<boolean>;
}

export class TestResultService implements ITestResultService {
  constructor(
    private readonly testResultRepository: ITestResultRepository,
    private readonly testRunRepository: ITestRunRepository,
    private readonly cache: CacheService,
  ) {}

  getAll(
    runId: string,
    status?: TestResultStatus,
    pagination?: PaginationParams,
    search?: string,
  ) {
    return this.testResultRepository.getAll(runId, status, pagination, search);
  }

  getById(runId: string, id: string) {
    return this.testResultRepository.getById(runId, id);
  }

  async create(
    runId: string,
    input: CreateTestResult,
    userId?: string,
  ): Promise<TestResult> {
    const run = await this.testRunRepository.findById(runId);
    if (!run) throw new DomainError('Test run not found');
    if (!canAddResultToRun(run.status)) {
      throw new DomainError(`Cannot add results to a ${run.status} test run`);
    }

    const result = await this.testResultRepository.create(runId, input, userId);
    await this.cache.del(cacheKeys.testRunSummary(runId));
    return result;
  }

  async update(
    runId: string,
    id: string,
    input: UpdateTestResult,
  ): Promise<TestResult | null> {
    const run = await this.testRunRepository.findById(runId);
    if (!run) throw new DomainError('Test run not found');
    if (!canAddResultToRun(run.status)) {
      throw new DomainError(`Cannot update results in a ${run.status} test run`);
    }

    const result = await this.testResultRepository.update(runId, id, input);
    if (result) await this.cache.del(cacheKeys.testRunSummary(runId));
    return result;
  }

  async delete(runId: string, id: string): Promise<boolean> {
    const deleted = await this.testResultRepository.delete(runId, id);
    if (deleted) await this.cache.del(cacheKeys.testRunSummary(runId));
    return deleted;
  }
}
