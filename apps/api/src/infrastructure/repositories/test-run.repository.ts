import {
  Paginated,
  PaginationParams,
  TestRunStatus,
  TestRunSummary,
} from "@testcraft/types";

import {
  CreateTestRun,
  ITestRunRepository,
  UpdateTestRun,
} from "@/application/test-runs/test-run.repository";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/domain/pagination";
import { TestRun } from "@/domain/test-run";
import { PrismaClient } from "@/generated/prisma/client";
import { isNotFound } from "@/infrastructure/database/prisma.errors";

export const runSelect = {
  id: true,
  projectId: true,
  name: true,
  environment: true,
  status: true,
  executedById: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const toDto = (run: {
  id: string;
  projectId: string;
  name: string;
  environment: string;
  status: string;
  executedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TestRun => ({ ...run, status: run.status as TestRunStatus });

export class TestRunRepository implements ITestRunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<TestRun | null> {
    const run = await this.prisma.testRun.findFirst({
      where: { id, isDeleted: false },
      select: runSelect,
    });
    return run ? toDto(run) : null;
  }

  async getAll(
    projectId: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestRun>> {
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
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.testRun.findMany({
        where,
        select: runSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.testRun.count({ where }),
    ]);
    return { items: rows.map(toDto), total, page, pageSize };
  }

  async getById(projectId: string, id: string): Promise<TestRun | null> {
    const run = await this.prisma.testRun.findFirst({
      where: { id, projectId, isDeleted: false, project: { isDeleted: false } },
      select: runSelect,
    });
    return run ? toDto(run) : null;
  }

  async getSummary(
    projectId: string,
    id: string,
  ): Promise<TestRunSummary | null> {
    const [exists, grouped] = await Promise.all([
      this.prisma.testRun.findFirst({
        where: {
          id,
          projectId,
          isDeleted: false,
          project: { isDeleted: false },
        },
        select: { id: true },
      }),
      this.prisma.testResult.groupBy({
        by: ["status"],
        where: { testRunId: id, isDeleted: false },
        _count: { status: true },
      }),
    ]);
    if (!exists) return null;

    const counts: Record<string, number> = {
      Passed: 0,
      Failed: 0,
      Blocked: 0,
      Skipped: 0,
    };
    for (const groupEntry of grouped) {
      counts[groupEntry.status] = groupEntry._count.status;
    }

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const passRate =
      total > 0 ? Math.round((counts["Passed"] / total) * 100) : 0;

    return {
      total,
      passed: counts["Passed"],
      failed: counts["Failed"],
      blocked: counts["Blocked"],
      skipped: counts["Skipped"],
      passRate,
    };
  }

  async create(projectId: string, input: CreateTestRun): Promise<TestRun> {
    const run = await this.prisma.testRun.create({
      data: {
        projectId,
        name: input.name,
        environment: input.environment,
        status: input.status ?? TestRunStatus.Active,
      },
      select: runSelect,
    });
    return toDto(run);
  }

  async update(
    projectId: string,
    id: string,
    input: UpdateTestRun,
  ): Promise<TestRun | null> {
    try {
      const run = await this.prisma.testRun.update({
        where: {
          id,
          projectId,
          isDeleted: false,
          project: { isDeleted: false },
        },
        data: {
          name: input.name,
          environment: input.environment,
          status: input.status,
        },
        select: runSelect,
      });
      return toDto(run);
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    try {
      await this.prisma.testRun.update({
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
