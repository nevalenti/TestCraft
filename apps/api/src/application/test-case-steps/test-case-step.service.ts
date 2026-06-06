import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateTestCaseStep,
  ITestCaseStepRepository,
  ReorderStep,
  UpdateTestCaseStep,
} from "@/application/test-case-steps/test-case-step.repository";
import { DomainError, NotFoundError } from "@/domain/errors";
import { TestCaseStep } from "@/domain/test-case-step";

export interface ITestCaseStepService {
  getAll(
    caseId: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestCaseStep>>;
  getById(caseId: string, id: string): Promise<TestCaseStep>;
  create(caseId: string, input: CreateTestCaseStep): Promise<TestCaseStep>;
  update(
    caseId: string,
    id: string,
    input: UpdateTestCaseStep,
  ): Promise<TestCaseStep>;
  bulkReorder(caseId: string, steps: ReorderStep[]): Promise<void>;
  delete(caseId: string, id: string): Promise<void>;
}

export class TestCaseStepService implements ITestCaseStepService {
  constructor(
    private readonly testCaseStepRepository: ITestCaseStepRepository,
  ) {}

  getAll(caseId: string, pagination?: PaginationParams) {
    return this.testCaseStepRepository.getAll(caseId, pagination);
  }

  async getById(caseId: string, id: string): Promise<TestCaseStep> {
    const step = await this.testCaseStepRepository.getById(caseId, id);
    if (!step) throw new NotFoundError();
    return step;
  }

  create(caseId: string, input: CreateTestCaseStep) {
    return this.testCaseStepRepository.create(caseId, input);
  }

  async update(
    caseId: string,
    id: string,
    input: UpdateTestCaseStep,
  ): Promise<TestCaseStep> {
    const step = await this.testCaseStepRepository.update(caseId, id, input);
    if (!step) throw new NotFoundError();
    return step;
  }

  async bulkReorder(caseId: string, steps: ReorderStep[]): Promise<void> {
    const ids = steps.map((s) => s.id);
    const found = await this.testCaseStepRepository.findByIds(caseId, ids);
    if (found.length !== ids.length) {
      throw new DomainError("One or more steps not found");
    }
    return this.testCaseStepRepository.bulkReorder(caseId, steps);
  }

  async delete(caseId: string, id: string): Promise<void> {
    const deleted = await this.testCaseStepRepository.delete(caseId, id);
    if (!deleted) throw new NotFoundError();
  }
}
