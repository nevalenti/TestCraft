import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateProject,
  IProjectRepository,
  UpdateProject,
} from "@/application/projects/project.repository";
import { resolvePagination } from "@/domain/pagination";
import { Project } from "@/domain/project";
import { PrismaClient } from "@/generated/prisma/client";
import { isNotFound } from "@/infrastructure/database/prisma.errors";

const projectSelect = {
  id: true,
  userId: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      testSuites: { where: { isDeleted: false } },
      testRuns: { where: { isDeleted: false } },
    },
  },
} as const;

const toDto = (project: {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { testSuites: number; testRuns: number };
}): Project => ({
  id: project.id,
  userId: project.userId,
  name: project.name,
  description: project.description,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
  suiteCount: project._count.testSuites,
  runCount: project._count.testRuns,
});

export class ProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(
    userId: string,
    search?: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<Project>> {
    const { page, pageSize, skip, take } = resolvePagination(pagination);
    const where = {
      userId,
      isDeleted: false,
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        select: projectSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.project.count({ where }),
    ]);
    return { items: rows.map(toDto), total, page, pageSize };
  }

  async getById(userId: string, id: string): Promise<Project | null> {
    const project = await this.prisma.project.findFirst({
      where: { id, userId, isDeleted: false },
      select: projectSelect,
    });
    return project ? toDto(project) : null;
  }

  async create(userId: string, input: CreateProject): Promise<Project> {
    const project = await this.prisma.project.create({
      data: {
        userId,
        name: input.name,
        description: input.description ?? null,
      },
      select: projectSelect,
    });
    return toDto(project);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateProject,
  ): Promise<Project | null> {
    try {
      const project = await this.prisma.project.update({
        where: { id, userId, isDeleted: false },
        data: { name: input.name, description: input.description ?? null },
        select: projectSelect,
      });
      return toDto(project);
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async delete(userId: string, id: string): Promise<boolean> {
    try {
      await this.prisma.project.update({
        where: { id, userId, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw err;
    }
  }
}
