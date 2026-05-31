import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateTestCaseStep,
  ITestCaseStepRepository,
  StepOrder,
  UpdateTestCaseStep,
} from "@/application/test-case-steps/test-case-step.repository";
import { TestCaseStep } from "@/domain/test-case-step";

export interface ITestCaseStepService {
  getAll(
    caseId: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestCaseStep>>;
  getById(caseId: string, id: string): Promise<TestCaseStep | null>;
  create(caseId: string, dto: CreateTestCaseStep): Promise<TestCaseStep>;
  update(
    caseId: string,
    id: string,
    dto: UpdateTestCaseStep,
  ): Promise<TestCaseStep | null>;
  bulkReorder(caseId: string, steps: StepOrder[]): Promise<void>;
  delete(caseId: string, id: string): Promise<boolean>;
}

export class TestCaseStepService implements ITestCaseStepService {
  constructor(private readonly repo: ITestCaseStepRepository) {}

  getAll(caseId: string, pagination?: PaginationParams) {
    return this.repo.getAll(caseId, pagination);
  }

  getById(caseId: string, id: string) {
    return this.repo.getById(caseId, id);
  }

  create(caseId: string, dto: CreateTestCaseStep) {
    return this.repo.create(caseId, dto);
  }

  update(caseId: string, id: string, dto: UpdateTestCaseStep) {
    return this.repo.update(caseId, id, dto);
  }

  bulkReorder(caseId: string, steps: StepOrder[]) {
    return this.repo.bulkReorder(caseId, steps);
  }

  delete(caseId: string, id: string) {
    return this.repo.delete(caseId, id);
  }
}
