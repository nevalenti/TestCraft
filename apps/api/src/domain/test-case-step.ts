export interface TestCaseStep {
  id: string;
  testCaseId: string;
  order: number;
  action: string;
  expectedResult: string;
  createdAt: Date;
  updatedAt: Date;
}
