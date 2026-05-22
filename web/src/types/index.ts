export interface ProjectDto {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  suiteCount?: number;
  runCount?: number;
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

export const TestCasePriority = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
} as const;

export type TestCasePriority =
  (typeof TestCasePriority)[keyof typeof TestCasePriority];

export interface TestCaseDto {
  id: string;
  suiteId: string;
  name: string;
  description?: string;
  priority: TestCasePriority;
  stepCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestCaseDto {
  name: string;
  description?: string;
  priority?: TestCasePriority;
}

export interface UpdateTestCaseDto {
  name: string;
  description?: string;
  priority: TestCasePriority;
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

export interface BulkReorderStepsDto {
  steps: { id: string; order: number }[];
}

export const TestRunStatus = {
  Active: 1,
  Completed: 2,
  Archived: 3,
} as const;

export type TestRunStatus = (typeof TestRunStatus)[keyof typeof TestRunStatus];

export interface TestRunDto {
  id: string;
  projectId: string;
  name: string;
  environment: string;
  status: TestRunStatus;
  executedById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestRunDto {
  name: string;
  environment: string;
  status?: TestRunStatus;
}

export interface UpdateTestRunDto {
  name: string;
  environment: string;
  status: TestRunStatus;
}

export interface TestRunSummaryDto {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  passRate: number;
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
  suiteId: string;
  testCaseName: string;
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

export const priorityOptions = [
  { value: TestCasePriority.Low, label: "Low" },
  { value: TestCasePriority.Medium, label: "Medium" },
  { value: TestCasePriority.High, label: "High" },
  { value: TestCasePriority.Critical, label: "Critical" },
] as const;

export const runStatusOptions = [
  { value: TestRunStatus.Active, label: "Active" },
  { value: TestRunStatus.Completed, label: "Completed" },
  { value: TestRunStatus.Archived, label: "Archived" },
] as const;
