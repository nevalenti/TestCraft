import { Paginated, PaginationParams } from "@testcraft/types";

import { Project } from "@/domain/project";

export interface CreateProject {
  name: string;
  description?: string | null;
}

export type UpdateProject = CreateProject;

export interface IProjectRepository {
  getAll(
    userId: string,
    search?: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<Project>>;
  getById(userId: string, id: string): Promise<Project | null>;
  create(userId: string, input: CreateProject): Promise<Project>;
  update(
    userId: string,
    id: string,
    input: UpdateProject,
  ): Promise<Project | null>;
  delete(userId: string, id: string): Promise<boolean>;
}
