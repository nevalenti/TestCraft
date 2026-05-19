export interface ProjectDto {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name: string;
  description?: string;
}

export interface TestSuiteDto {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestSuiteDto {
  name: string;
  description?: string;
}

export interface UpdateTestSuiteDto {
  name: string;
  description?: string;
}

export interface TestCaseDto {
  id: string;
  suiteId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestCaseDto {
  name: string;
  description?: string;
}

export interface UpdateTestCaseDto {
  name: string;
  description?: string;
}

export interface TestCaseStepDto {
  id: string;
  testCaseId: string;
  order: number;
  action: string;
  expectedResult: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestCaseStepDto {
  order: number;
  action: string;
  expectedResult: string;
}

export interface UpdateTestCaseStepDto {
  order: number;
  action: string;
  expectedResult: string;
}

export interface TestRunDto {
  id: string;
  projectId: string;
  name: string;
  environment: string;
  executedById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestRunDto {
  name: string;
  environment: string;
}

export interface UpdateTestRunDto {
  name: string;
  environment: string;
}

export const TestResultStatus = {
  Passed: 1,
  Failed: 2,
  Blocked: 3,
  Skipped: 4,
} as const;

export type TestResultStatus =
  (typeof TestResultStatus)[keyof typeof TestResultStatus];

export interface TestResultDto {
  id: string;
  testRunId: string;
  testCaseId: string;
  status: TestResultStatus;
  notes?: string;
  executedAt: string;
  executedById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestResultDto {
  testCaseId: string;
  status: TestResultStatus;
  notes?: string;
  executedAt: string;
}

export interface UpdateTestResultDto {
  status: TestResultStatus;
  notes?: string;
}

export type ModalState<T> =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; item: T }
  | { type: "delete"; item: T };

export const statusOptions = [
  { value: TestResultStatus.Passed, label: "Passed" },
  { value: TestResultStatus.Failed, label: "Failed" },
  { value: TestResultStatus.Blocked, label: "Blocked" },
  { value: TestResultStatus.Skipped, label: "Skipped" },
] as const;
