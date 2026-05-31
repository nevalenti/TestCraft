import { TestResultStatus } from '@testcraft/types';
import { Paginated, PaginationParams } from '@testcraft/types';

import { ITestResultRepository } from '@/application/test-results/test-result.repository';
import {
  CreateTestResult,
  UpdateTestResult,
} from '@/application/test-results/test-result.repository';
import { ITestRunRepository } from '@/application/test-runs/test-run.repository';
import { DomainError } from '@/domain/errors';
import { canAddResultToRun } from '@/domain/rules';
import { TestResult } from '@/domain/test-result';

export interface ITestResultService {
  getAll(
    runId: string,
    status?: TestResultStatus,
    pagination?: PaginationParams,
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
  ) {}

  getAll(
    runId: string,
    status?: TestResultStatus,
    pagination?: PaginationParams,
  ) {
    return this.testResultRepository.getAll(runId, status, pagination);
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

    return this.testResultRepository.create(runId, input, userId);
  }

  update(runId: string, id: string, input: UpdateTestResult) {
    return this.testResultRepository.update(runId, id, input);
  }

  delete(runId: string, id: string) {
    return this.testResultRepository.delete(runId, id);
  }
}
