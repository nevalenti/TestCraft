export interface TestSuite {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestSuiteInput {
  name: string;
  description?: string;
}

export interface UpdateTestSuiteInput {
  name: string;
  description?: string;
}
