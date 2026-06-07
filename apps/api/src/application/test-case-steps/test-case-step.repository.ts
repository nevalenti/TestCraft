import { Paginated, PaginationParams } from "@testcraft/types";

import { TestCaseStep } from "@/domain/test-case-step";

export interface CreateTestCaseStep {
  order: number;
  action: string;
  expectedResult: string;
}

export type UpdateTestCaseStep = CreateTestCaseStep;

export interface ReorderStep {
  id: string;
  order: number;
}

export interface ITestCaseStepRepository {
  getAll(
    caseId: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestCaseStep>>;
  getById(caseId: string, id: string): Promise<TestCaseStep | null>;
  findByIds(caseId: string, ids: string[]): Promise<{ id: string }[]>;
  create(caseId: string, input: CreateTestCaseStep): Promise<TestCaseStep>;
  update(
    caseId: string,
    id: string,
    input: UpdateTestCaseStep,
  ): Promise<TestCaseStep | null>;
  bulkReorder(caseId: string, steps: ReorderStep[]): Promise<void>;
  delete(caseId: string, id: string): Promise<boolean>;
}
