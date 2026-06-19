export interface TestPlan {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  caseCount: number;
  createdAt: string;
}

export interface TestPlanCase {
  testCaseId: string;
  testCaseName: string;
  order: number;
}

export interface CreateTestPlan {
  name: string;
  description?: string;
}

export interface UpdateTestPlan {
  name: string;
  description?: string;
}
