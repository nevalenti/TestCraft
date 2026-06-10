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
import { resolvePagination } from "@/domain/pagination";
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

const toTestCase = (testCase: {
  id: string;
  suiteId: string;
  name: string;
  description: string | null;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { steps: number };
}): TestCase => ({
  id: testCase.id,
  suiteId: testCase.suiteId,
  name: testCase.name,
  description: testCase.description,
  priority: testCase.priority as TestCasePriority,
  stepCount: testCase._count.steps,
  createdAt: testCase.createdAt,
  updatedAt: testCase.updatedAt,
});

export class TestCaseRepository implements ITestCaseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(
    suiteId: string,
    search?: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestCase>> {
    const { page, pageSize, skip, take } = resolvePagination(pagination);
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
        take,
      }),
      this.prisma.testCase.count({ where }),
    ]);

    return { items: rows.map(toTestCase), total, page, pageSize };
  }

  async getAllByProject(
    projectId: string,
    search?: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestCase>> {
    const { page, pageSize, skip, take } = resolvePagination(pagination);
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
        take,
      }),
      this.prisma.testCase.count({ where }),
    ]);

    return { items: rows.map(toTestCase), total, page, pageSize };
  }

  async getById(suiteId: string, id: string): Promise<TestCase | null> {
    const testCase = await this.prisma.testCase.findFirst({
      where: { id, suiteId, isDeleted: false, suite: { isDeleted: false } },
      select: caseSelect,
    });

    return testCase ? toTestCase(testCase) : null;
  }

  async create(suiteId: string, input: CreateTestCase): Promise<TestCase> {
    const testCase = await this.prisma.testCase.create({
      data: {
        suiteId,
        name: input.name,
        description: input.description ?? null,
        priority: input.priority ?? TestCasePriority.Medium,
      },
      select: caseSelect,
    });

    return toTestCase(testCase);
  }

  async update(
    suiteId: string,
    id: string,
    input: UpdateTestCase,
  ): Promise<TestCase | null> {
    try {
      const testCase = await this.prisma.testCase.update({
        where: { id, suiteId, isDeleted: false, suite: { isDeleted: false } },
        data: {
          name: input.name,
          description: input.description ?? null,
          priority: input.priority,
        },
        select: caseSelect,
      });

      return toTestCase(testCase);
    } catch (err) {
      if (isNotFound(err)) return null;

      throw err;
    }
  }

  async delete(suiteId: string, id: string): Promise<boolean> {
    try {
      await this.prisma.testCase.update({
        where: { id, suiteId, isDeleted: false, suite: { isDeleted: false } },
        data: { isDeleted: true, deletedAt: new Date() },
      });

      return true;
    } catch (err) {
      if (isNotFound(err)) return false;

      throw err;
    }
  }
}
