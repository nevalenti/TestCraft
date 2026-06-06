import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateTestSuite,
  ITestSuiteRepository,
  UpdateTestSuite,
} from "@/application/test-suites/test-suite.repository";
import { resolvePagination } from "@/domain/pagination";
import { TestSuite } from "@/domain/test-suite";
import { PrismaClient } from "@/generated/prisma/client";
import { isNotFound } from "@/infrastructure/database/prisma.errors";

const suiteSelect = {
  id: true,
  projectId: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class TestSuiteRepository implements ITestSuiteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(
    projectId: string,
    pagination?: PaginationParams,
    search?: string,
  ): Promise<Paginated<TestSuite>> {
    const { page, pageSize, skip, take } = resolvePagination(pagination);
    const where = {
      projectId,
      isDeleted: false,
      project: { isDeleted: false },
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.testSuite.findMany({
        where,
        select: suiteSelect,
        orderBy: { createdAt: "asc" },
        skip,
        take,
      }),
      this.prisma.testSuite.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getById(projectId: string, id: string): Promise<TestSuite | null> {
    return this.prisma.testSuite.findFirst({
      where: { id, projectId, isDeleted: false, project: { isDeleted: false } },
      select: suiteSelect,
    });
  }

  async create(projectId: string, input: CreateTestSuite): Promise<TestSuite> {
    return this.prisma.testSuite.create({
      data: {
        projectId,
        name: input.name,
        description: input.description ?? null,
      },
      select: suiteSelect,
    });
  }

  async update(
    projectId: string,
    id: string,
    input: UpdateTestSuite,
  ): Promise<TestSuite | null> {
    try {
      return await this.prisma.testSuite.update({
        where: {
          id,
          projectId,
          isDeleted: false,
          project: { isDeleted: false },
        },
        data: { name: input.name, description: input.description ?? null },
        select: suiteSelect,
      });
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    try {
      await this.prisma.testSuite.update({
        where: {
          id,
          projectId,
          isDeleted: false,
          project: { isDeleted: false },
        },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw err;
    }
  }
}
