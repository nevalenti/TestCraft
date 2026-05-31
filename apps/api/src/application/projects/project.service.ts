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
  create(userId: string, input: CreateProject): Promise<Project>;
  update(
    userId: string,
    id: string,
    input: UpdateProject,
  ): Promise<Project | null>;
  delete(userId: string, id: string): Promise<boolean>;
}

export class ProjectService implements IProjectService {
  constructor(private readonly projectRepository: IProjectRepository) {}

  getAll(userId: string, search?: string, pagination?: PaginationParams) {
    return this.projectRepository.getAll(userId, search, pagination);
  }

  getById(userId: string, id: string) {
    return this.projectRepository.getById(userId, id);
  }

  create(userId: string, input: CreateProject) {
    return this.projectRepository.create(userId, input);
  }

  update(userId: string, id: string, input: UpdateProject) {
    return this.projectRepository.update(userId, id, input);
  }

  delete(userId: string, id: string) {
    return this.projectRepository.delete(userId, id);
  }
}
