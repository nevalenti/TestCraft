import type { TestRunStatus } from "@testcraft/types";

import type {
  IImportRepository,
  ParsedCase,
} from "@/application/import/import.repository";
import type { TestRun } from "@/domain/test-run";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import {
  runSelect,
  toDto,
} from "@/infrastructure/repositories/test-run.repository";

const insertResults = async (
  transaction: Prisma.TransactionClient,
  projectId: string,
  runId: string,
  cases: ParsedCase[],
  userId: string | undefined,
  now: Date,
) => {
  const uniqueSuiteNames = [
    ...new Set(cases.map((parsedCase) => parsedCase.suiteName)),
  ];

  const existingSuites = await transaction.testSuite.findMany({
    where: { projectId, name: { in: uniqueSuiteNames }, isDeleted: false },
    select: { id: true, name: true },
  });
  const suiteMap = new Map(
    existingSuites.map((suite) => [suite.name, suite.id]),
  );

  for (const name of uniqueSuiteNames) {
    if (!suiteMap.has(name)) {
      const created = await transaction.testSuite.create({
        data: { projectId, name },
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
    }
  }

  // Deduplicate on (suiteId, caseName) — keep last entry per pair so
  // repeated testcase names in one suite (e.g. retry reports) don't produce
  // multiple result rows for the same test case in the same run.
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
    cases: ParsedCase[],
    userId: string | undefined,
  ): Promise<TestRun> {
    const now = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const run = await transaction.testRun.create({
        data: {
          projectId,
          name,
          environment,
          status,
          executedById: userId ?? null,
        },
        select: runSelect,
      });
      await insertResults(transaction, projectId, run.id, cases, userId, now);
      return toDto(run);
    });
  }
}
