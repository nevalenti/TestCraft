import type { TestRunStatus } from "@testcraft/types";

import type {
  IImportRepository,
  ParsedTestCase,
} from "@/application/import/import.repository";
import type { TestRun } from "@/domain/test-run";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import {
  runSelect,
  toTestRun,
} from "@/infrastructure/repositories/test-run.mapper";

const insertResults = async (
  transaction: Prisma.TransactionClient,
  projectId: string,
  runId: string,
  cases: ParsedTestCase[],
  now: Date,
  userId?: string,
  source?: string,
) => {
  const uniqueSuiteNames = [
    ...new Set(cases.map((parsedCase) => parsedCase.suiteName)),
  ];

  const existingSuites = await transaction.testSuite.findMany({
    where: { projectId, name: { in: uniqueSuiteNames }, isDeleted: false },
    select: { id: true, name: true, source: true },
  });
  const suiteMap = new Map(
    existingSuites.map((suite) => [suite.name, suite.id]),
  );

  if (source) {
    for (const suite of existingSuites) {
      if (!suite.source) {
        await transaction.testSuite.update({
          where: { id: suite.id },
          data: { source },
        });
      }
    }
  }

  for (const name of uniqueSuiteNames) {
    if (!suiteMap.has(name)) {
      const created = await transaction.testSuite.create({
        data: { projectId, name, source: source ?? null },
        select: { id: true },
      });

      suiteMap.set(name, created.id);
    }
  }

  const suiteIds = [...suiteMap.values()];
  const uniqueCaseNames = [
    ...new Set(cases.map((parsedCase) => parsedCase.caseName)),
  ];

  const existingCases = await transaction.testCase.findMany({
    where: {
      suiteId: { in: suiteIds },
      name: { in: uniqueCaseNames },
      isDeleted: false,
    },
    select: { id: true, name: true, suiteId: true },
  });
  const caseMap = new Map(
    existingCases.map((existingCase) => [
      `${existingCase.suiteId}::${existingCase.name}`,
      existingCase.id,
    ]),
  );

  for (const parsedCase of cases) {
    const suiteId = suiteMap.get(parsedCase.suiteName)!;
    const key = `${suiteId}::${parsedCase.caseName}`;

    if (!caseMap.has(key)) {
      const created = await transaction.testCase.create({
        data: { suiteId, name: parsedCase.caseName },
        select: { id: true },
      });

      caseMap.set(key, created.id);
      if (parsedCase.steps?.length) {
        await transaction.testCaseStep.createMany({
          data: parsedCase.steps.map((step) => ({
            testCaseId: created.id,
            order: step.order,
            action: step.action,
            expectedResult: step.expectedResult,
          })),
        });
      }
    }
  }

  const dedupedCases = [
    ...new Map(
      cases.map((parsedCase) => [
        `${suiteMap.get(parsedCase.suiteName)}::${parsedCase.caseName}`,
        parsedCase,
      ]),
    ).values(),
  ];

  await transaction.testResult.createMany({
    data: dedupedCases.map((parsedCase) => ({
      testRunId: runId,
      testCaseId: caseMap.get(
        `${suiteMap.get(parsedCase.suiteName)}::${parsedCase.caseName}`,
      )!,
      status: parsedCase.status,
      notes: parsedCase.notes,
      executedAt: now,
      executedById: userId ?? null,
    })),
  });
};

export class ImportRepository implements IImportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createRunWithResults(
    projectId: string,
    name: string,
    environment: string,
    status: TestRunStatus,
    cases: ParsedTestCase[],
    userId?: string,
    source?: string,
  ): Promise<TestRun> {
    const now = new Date();

    return this.prisma.$transaction(async (transaction) => {
      const run = await transaction.testRun.create({
        data: {
          projectId,
          name,
          environment,
          status,
          source: source ?? null,
          executedById: userId ?? null,
        },
        select: runSelect,
      });

      await insertResults(
        transaction,
        projectId,
        run.id,
        cases,
        now,
        userId,
        source,
      );

      return toTestRun(run);
    });
  }
}
