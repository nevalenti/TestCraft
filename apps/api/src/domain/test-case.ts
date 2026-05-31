import { TestCasePriority } from "@testcraft/types";

export interface TestCase {
  id: string;
  suiteId: string;
  name: string;
  description: string | null;
  priority: TestCasePriority;
  stepCount: number;
  createdAt: Date;
  updatedAt: Date;
}
