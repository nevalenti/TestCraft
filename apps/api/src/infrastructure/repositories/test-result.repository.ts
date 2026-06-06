import { TestResultStatus } from "@testcraft/types";
import { Paginated, PaginationParams } from "@testcraft/types";

import { ITestResultRepository } from "@/application/test-results/test-result.repository";
import {
  CreateTestResult,
  UpdateTestResult,
} from "@/application/test-results/test-result.repository";
import { resolvePagination } from "@/domain/pagination";
import { TestResult } from "@/domain/test-result";
import { PrismaClient } from "@/generated/prisma/client";
import { isNotFound } from "@/infrastructure/database/prisma.errors";

const resultInclude = {
  testCase: { select: { name: true, suiteId: true } },
} as const;

const toDto = (result: {
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
  id: result.id,
  testRunId: result.testRunId,
  testCaseId: result.testCaseId,
  suiteId: result.testCase.suiteId,
  testCaseName: result.testCase.name,
  status: result.status as TestResultStatus,
  notes: result.notes,
  executedAt: result.executedAt,
  executedById: result.executedById,
  createdAt: result.createdAt,
  updatedAt: result.updatedAt,
});

export class TestResultRepository implements ITestResultRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(
    runId: string,
    status?: TestResultStatus,
    pagination?: PaginationParams,
    search?: string,
  ): Promise<Paginated<TestResult>> {
    const { page, pageSize, skip, take } = resolvePagination(pagination);
    const where = {
      testRunId: runId,
      isDeleted: false,
      testRun: { isDeleted: false },
      ...(status ? { status } : {}),
      ...(search
        ? {
            testCase: {
              name: { contains: search, mode: "insensitive" as const },
            },
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.testResult.findMany({
        where,
        include: resultInclude,
        orderBy: { createdAt: "asc" },
        skip,
        take,
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
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
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
    } catch (err) {
      if (isNotFound(err)) return false;
      throw err;
    }
  }
}
