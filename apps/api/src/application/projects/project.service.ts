import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateProject,
  IProjectRepository,
  UpdateProject,
} from "@/application/projects/project.repository";
import { NotFoundError } from "@/domain/errors";
import { Project } from "@/domain/project";

export interface IProjectService {
  getAll(
    userId: string,
    search?: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<Project>>;
  getById(userId: string, id: string): Promise<Project>;
  create(userId: string, input: CreateProject): Promise<Project>;
  update(userId: string, id: string, input: UpdateProject): Promise<Project>;
  delete(userId: string, id: string): Promise<void>;
}

export class ProjectService implements IProjectService {
  constructor(private readonly projectRepository: IProjectRepository) {}

  getAll(userId: string, search?: string, pagination?: PaginationParams) {
    return this.projectRepository.getAll(userId, search, pagination);
  }

  async getById(userId: string, id: string): Promise<Project> {
    const project = await this.projectRepository.getById(userId, id);
    if (!project) throw new NotFoundError();
    return project;
  }

  create(userId: string, input: CreateProject): Promise<Project> {
    return this.projectRepository.create(userId, input);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateProject,
  ): Promise<Project> {
    const project = await this.projectRepository.update(userId, id, input);
    if (!project) throw new NotFoundError();
    return project;
  }

  async delete(userId: string, id: string): Promise<void> {
    const deleted = await this.projectRepository.delete(userId, id);
    if (!deleted) throw new NotFoundError();
  }
}
