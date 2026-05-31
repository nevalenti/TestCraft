export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  suiteCount: number;
  runCount: number;
}
