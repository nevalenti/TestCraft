import { TestRunStatus } from "@testcraft/types";

export interface TestRun {
  id: string;
  projectId: string;
  name: string;
  environment: string;
  status: TestRunStatus;
  source: string | null;
  executedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}
