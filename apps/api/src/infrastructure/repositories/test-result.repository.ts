import { TestResultStatus } from "@testcraft/types";
import { Paginated, PaginationParams } from "@testcraft/types";

import { ITestResultRepository } from "@/application/test-results/test-result.repository";
import {
  CreateTestResult,
  UpdateTestResult,
} from "@/application/test-results/test-result.repository";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/domain/pagination";
import { TestResult } from "@/domain/test-result";
import { PrismaClient } from "@/generated/prisma/client";
import { isNotFound } from "@/infrastructure/database/prisma.errors";

const resultInclude = {
  testCase: { select: { name: true, suiteId: true } },
} as const;

const toDto = (r: {
  id: string;
  testRunId: string;
  testCaseId: string;
  status: string;
  notes: string | null;
  executedAt: Date;
  executedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  testCase: { name: string; suiteId: string };
}): TestResult => ({
  id: r.id,
  testRunId: r.testRunId,
  testCaseId: r.testCaseId,
  suiteId: r.testCase.suiteId,
  testCaseName: r.testCase.name,
  status: r.status as TestResultStatus,
  notes: r.notes,
  executedAt: r.executedAt,
  executedById: r.executedById,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

export class TestResultRepository implements ITestResultRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(
    runId: string,
    status?: TestResultStatus,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestResult>> {
    const { page, pageSize } = pagination ?? {
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    };
    const skip = (page - 1) * pageSize;
    const where = {
      testRunId: runId,
      isDeleted: false,
      testRun: { isDeleted: false },
      ...(status ? { status } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.testResult.findMany({
        where,
        include: resultInclude,
        orderBy: { createdAt: "asc" },
        skip,
        take: pageSize,
      }),
      this.prisma.testResult.count({ where }),
    ]);
    return { items: rows.map(toDto), total, page, pageSize };
  }

  async getById(runId: string, id: string): Promise<TestResult | null> {
    const result = await this.prisma.testResult.findFirst({
      where: {
        id,
        testRunId: runId,
        isDeleted: false,
        testRun: { isDeleted: false },
      },
      include: resultInclude,
    });
    return result ? toDto(result) : null;
  }

  async create(
    runId: string,
    input: CreateTestResult,
    userId?: string,
  ): Promise<TestResult> {
    const result = await this.prisma.testResult.create({
      data: {
        testRunId: runId,
        testCaseId: input.testCaseId,
        status: input.status,
        notes: input.notes ?? null,
        executedAt: input.executedAt,
        executedById: userId ?? null,
      },
      include: resultInclude,
    });
    return toDto(result);
  }

  async update(
    runId: string,
    id: string,
    input: UpdateTestResult,
  ): Promise<TestResult | null> {
    try {
      const result = await this.prisma.testResult.update({
        where: {
          id,
          testRunId: runId,
          isDeleted: false,
          testRun: { isDeleted: false },
        },
        data: { status: input.status, notes: input.notes ?? null },
        include: resultInclude,
      });
      return toDto(result);
    } catch (e) {
      if (isNotFound(e)) return null;
      throw e;
    }
  }

  async delete(runId: string, id: string): Promise<boolean> {
    try {
      await this.prisma.testResult.update({
        where: {
          id,
          testRunId: runId,
          isDeleted: false,
          testRun: { isDeleted: false },
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
