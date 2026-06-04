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

export interface CreateTestCase {
  name: string;
  description?: string;
  priority?: TestCasePriority;
}

export interface UpdateTestCase {
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

export interface CreateTestCaseStep {
  order: number;
  action: string;
  expectedResult: string;
}

export interface UpdateTestCaseStep {
  order: number;
  action: string;
  expectedResult: string;
}

export interface BulkReorderSteps {
  steps: { id: string; order: number }[];
}
