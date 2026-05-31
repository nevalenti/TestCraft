import {
  Paginated,
  PaginationParams,
  TestCasePriority,
} from "@testcraft/types";

import {
  CreateTestCase,
  ITestCaseRepository,
  UpdateTestCase,
} from "@/application/test-cases/test-case.repository";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/domain/pagination";
import { TestCase } from "@/domain/test-case";
import { PrismaClient } from "@/generated/prisma/client";
import { isNotFound } from "@/infrastructure/database/prisma.errors";

const caseSelect = {
  id: true,
  suiteId: true,
  name: true,
  description: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { steps: { where: { isDeleted: false } } } },
} as const;

const toDto = (tc: {
  id: string;
  suiteId: string;
  name: string;
  description: string | null;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { steps: number };
}): TestCase => ({
  id: tc.id,
  suiteId: tc.suiteId,
  name: tc.name,
  description: tc.description,
  priority: tc.priority as TestCasePriority,
  stepCount: tc._count.steps,
  createdAt: tc.createdAt,
  updatedAt: tc.updatedAt,
});

export class TestCaseRepository implements ITestCaseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(
    suiteId: string,
    search?: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestCase>> {
    const { page, pageSize } = pagination ?? {
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    };
    const skip = (page - 1) * pageSize;
    const where = {
      suiteId,
      isDeleted: false,
      suite: { isDeleted: false },
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.testCase.findMany({
        where,
        select: caseSelect,
        orderBy: { createdAt: "asc" },
        skip,
        take: pageSize,
      }),
      this.prisma.testCase.count({ where }),
    ]);
    return { items: rows.map(toDto), total, page, pageSize };
  }

  async getAllByProject(
    projectId: string,
    search?: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestCase>> {
    const { page, pageSize } = pagination ?? {
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    };
    const skip = (page - 1) * pageSize;
    const where = {
      isDeleted: false,
      suite: { projectId, isDeleted: false, project: { isDeleted: false } },
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.testCase.findMany({
        where,
        select: caseSelect,
        orderBy: { createdAt: "asc" },
        skip,
        take: pageSize,
      }),
      this.prisma.testCase.count({ where }),
    ]);
    return { items: rows.map(toDto), total, page, pageSize };
  }

  async getById(suiteId: string, id: string): Promise<TestCase | null> {
    const tc = await this.prisma.testCase.findFirst({
      where: { id, suiteId, isDeleted: false, suite: { isDeleted: false } },
      select: caseSelect,
    });
    return tc ? toDto(tc) : null;
  }

  async create(suiteId: string, dto: CreateTestCase): Promise<TestCase> {
    const tc = await this.prisma.testCase.create({
      data: {
        suiteId,
        name: dto.name,
        description: dto.description ?? null,
        priority: dto.priority ?? TestCasePriority.Medium,
      },
      select: caseSelect,
    });
    return toDto(tc);
  }

  async update(
    suiteId: string,
    id: string,
    dto: UpdateTestCase,
  ): Promise<TestCase | null> {
    try {
      const tc = await this.prisma.testCase.update({
        where: { id, suiteId, isDeleted: false, suite: { isDeleted: false } },
        data: {
          name: dto.name,
          description: dto.description ?? null,
          priority: dto.priority,
        },
        select: caseSelect,
      });
      return toDto(tc);
    } catch (e) {
      if (isNotFound(e)) return null;
      throw e;
    }
  }

  async delete(suiteId: string, id: string): Promise<boolean> {
    try {
      await this.prisma.testCase.update({
        where: { id, suiteId, isDeleted: false, suite: { isDeleted: false } },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      return true;
    } catch (e) {
      if (isNotFound(e)) return false;
      throw e;
    }
  }
}
