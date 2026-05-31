import type { TestCasePriority } from "./enums.js";

export interface TestCase {
  id: string;
  suiteId: string;
  name: string;
  description?: string;
  priority: TestCasePriority;
  stepCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestCaseInput {
  name: string;
  description?: string;
  priority?: TestCasePriority;
}

export interface UpdateTestCaseInput {
  name: string;
  description?: string;
  priority: TestCasePriority;
}

export interface TestCaseStep {
  id: string;
  testCaseId: string;
  order: number;
  action: string;
  expectedResult: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestCaseStepInput {
  order: number;
  action: string;
  expectedResult: string;
}

export interface UpdateTestCaseStepInput {
  order: number;
  action: string;
  expectedResult: string;
}

export interface BulkReorderStepsInput {
  steps: { id: string; order: number }[];
}
