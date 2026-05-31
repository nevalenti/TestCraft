import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateProject,
  IProjectRepository,
  UpdateProject,
} from "@/application/projects/project.repository";
import { Project } from "@/domain/project";

export interface IProjectService {
  getAll(
    userId: string,
    search?: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<Project>>;
  getById(userId: string, id: string): Promise<Project | null>;
  create(userId: string, dto: CreateProject): Promise<Project>;
  update(
    userId: string,
    id: string,
    dto: UpdateProject,
  ): Promise<Project | null>;
  delete(userId: string, id: string): Promise<boolean>;
}

export class ProjectService implements IProjectService {
  constructor(private readonly repo: IProjectRepository) {}

  getAll(userId: string, search?: string, pagination?: PaginationParams) {
    return this.repo.getAll(userId, search, pagination);
  }

  getById(userId: string, id: string) {
    return this.repo.getById(userId, id);
  }

  create(userId: string, dto: CreateProject) {
    return this.repo.create(userId, dto);
  }

  update(userId: string, id: string, dto: UpdateProject) {
    return this.repo.update(userId, id, dto);
  }

  delete(userId: string, id: string) {
    return this.repo.delete(userId, id);
  }
}
