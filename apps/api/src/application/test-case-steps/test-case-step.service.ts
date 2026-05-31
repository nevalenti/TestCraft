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
  create(caseId: string, input: CreateTestCaseStep): Promise<TestCaseStep>;
  update(
    caseId: string,
    id: string,
    input: UpdateTestCaseStep,
  ): Promise<TestCaseStep | null>;
  bulkReorder(caseId: string, steps: StepOrder[]): Promise<void>;
  delete(caseId: string, id: string): Promise<boolean>;
}

export class TestCaseStepService implements ITestCaseStepService {
  constructor(
    private readonly testCaseStepRepository: ITestCaseStepRepository,
  ) {}

  getAll(caseId: string, pagination?: PaginationParams) {
    return this.testCaseStepRepository.getAll(caseId, pagination);
  }

  getById(caseId: string, id: string) {
    return this.testCaseStepRepository.getById(caseId, id);
  }

  create(caseId: string, input: CreateTestCaseStep) {
    return this.testCaseStepRepository.create(caseId, input);
  }

  update(caseId: string, id: string, input: UpdateTestCaseStep) {
    return this.testCaseStepRepository.update(caseId, id, input);
  }

  bulkReorder(caseId: string, steps: StepOrder[]) {
    return this.testCaseStepRepository.bulkReorder(caseId, steps);
  }

  delete(caseId: string, id: string) {
    return this.testCaseStepRepository.delete(caseId, id);
  }
}
