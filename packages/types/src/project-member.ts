export interface ProjectMember {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

export interface AddProjectMember {
  email: string;
}
