export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  suiteCount?: number;
  runCount?: number;
  isOwner: boolean;
}

export interface CreateProject {
  name: string;
  description?: string;
}

export interface UpdateProject {
  name: string;
  description?: string;
}
