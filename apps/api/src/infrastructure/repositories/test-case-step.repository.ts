import { Paginated, PaginationParams } from "@testcraft/types";

import {
  CreateTestCaseStep,
  ITestCaseStepRepository,
  StepOrder,
  UpdateTestCaseStep,
} from "@/application/test-case-steps/test-case-step.repository";
import { DomainError } from "@/domain/errors";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/domain/pagination";
import { TestCaseStep } from "@/domain/test-case-step";
import { PrismaClient } from "@/generated/prisma/client";
import { isNotFound } from "@/infrastructure/database/prisma.errors";

const stepSelect = {
  id: true,
  testCaseId: true,
  order: true,
  action: true,
  expectedResult: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class TestCaseStepRepository implements ITestCaseStepRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(
    caseId: string,
    pagination?: PaginationParams,
  ): Promise<Paginated<TestCaseStep>> {
    const { page, pageSize } = pagination ?? {
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    };
    const skip = (page - 1) * pageSize;
    const where = {
      testCaseId: caseId,
      isDeleted: false,
      testCase: { isDeleted: false },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.testCaseStep.findMany({
        where,
        select: stepSelect,
        orderBy: { order: "asc" },
        skip,
        take: pageSize,
      }),
      this.prisma.testCaseStep.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getById(caseId: string, id: string): Promise<TestCaseStep | null> {
    return this.prisma.testCaseStep.findFirst({
      where: {
        id,
        testCaseId: caseId,
        isDeleted: false,
        testCase: { isDeleted: false },
      },
      select: stepSelect,
    });
  }

  async create(caseId: string, dto: CreateTestCaseStep): Promise<TestCaseStep> {
    return this.prisma.testCaseStep.create({
      data: {
        testCaseId: caseId,
        order: dto.order,
        action: dto.action,
        expectedResult: dto.expectedResult,
      },
      select: stepSelect,
    });
  }

  async update(
    caseId: string,
    id: string,
    dto: UpdateTestCaseStep,
  ): Promise<TestCaseStep | null> {
    try {
      return await this.prisma.testCaseStep.update({
        where: {
          id,
          testCaseId: caseId,
          isDeleted: false,
          testCase: { isDeleted: false },
        },
        data: {
          order: dto.order,
          action: dto.action,
          expectedResult: dto.expectedResult,
        },
        select: stepSelect,
      });
    } catch (e) {
      if (isNotFound(e)) return null;
      throw e;
    }
  }

  async bulkReorder(caseId: string, steps: StepOrder[]): Promise<void> {
    const ids = steps.map((s) => s.id);
    const found = await this.prisma.testCaseStep.findMany({
      where: {
        id: { in: ids },
        testCaseId: caseId,
        isDeleted: false,
        testCase: { isDeleted: false },
      },
      select: { id: true },
    });
    if (found.length !== ids.length) {
      throw new DomainError("One or more steps not found");
    }
    await this.prisma.$transaction(
      steps.map(({ id, order }) =>
        this.prisma.testCaseStep.update({ where: { id }, data: { order } }),
      ),
    );
  }

  async delete(caseId: string, id: string): Promise<boolean> {
    try {
      await this.prisma.testCaseStep.update({
        where: {
          id,
          testCaseId: caseId,
          isDeleted: false,
          testCase: { isDeleted: false },
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
