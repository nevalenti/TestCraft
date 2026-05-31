import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateTestSuite,
  ITestSuiteRepository,
  UpdateTestSuite,
} from "@/application/test-suites/test-suite.repository";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/domain/pagination";
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
  ): Promise<Paginated<TestSuite>> {
    const { page, pageSize } = pagination ?? {
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    };
    const skip = (page - 1) * pageSize;
    const where = {
      projectId,
      isDeleted: false,
      project: { isDeleted: false },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.testSuite.findMany({
        where,
        select: suiteSelect,
        orderBy: { createdAt: "asc" },
        skip,
        take: pageSize,
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
    } catch (e) {
      if (isNotFound(e)) return null;
      throw e;
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
    } catch (e) {
      if (isNotFound(e)) return false;
      throw e;
    }
  }
}
