export interface TestSuite {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
