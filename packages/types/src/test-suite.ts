export interface TestSuite {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTestSuite {
  name: string;
  description?: string;
}

export interface UpdateTestSuite {
  name: string;
  description?: string;
}
