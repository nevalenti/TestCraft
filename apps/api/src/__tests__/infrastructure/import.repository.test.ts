import { PrismaPg } from "@prisma/adapter-pg";
import { TestResultStatus, TestRunStatus } from "@testcraft/types";
import { inject } from "vitest";

import { ParsedTestCase } from "@/application/import/import.repository";
import { PrismaClient } from "@/generated/prisma/client";
import { ImportRepository } from "@/infrastructure/repositories/import.repository";

const USER_A = "a0000000-0000-0000-0000-000000000001";

const parsed = (
  suiteName: string,
  caseName: string,
  status: TestResultStatus = TestResultStatus.Passed,
): ParsedTestCase => ({ suiteName, caseName, status, notes: null });

describe("ImportRepository #integration", { tags: ["integration"] }, () => {
  let prisma: PrismaClient;
  let repo: ImportRepository;
  let projectId: string;

  beforeAll(async () => {
    const databaseUrl = inject("databaseUrl");
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    repo = new ImportRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE projects CASCADE`;
    const project = await prisma.project.create({
      data: { name: "Project", userId: USER_A },
      select: { id: true },
    });
    projectId = project.id;
  });

  describe("createRunWithResults", () => {
    it("creates a run, suites, cases, and results in one transaction", async () => {
      const cases: ParsedTestCase[] = [
        parsed("Auth Suite", "Login with valid creds", TestResultStatus.Passed),
        parsed("Auth Suite", "Login with bad creds", TestResultStatus.Failed),
        parsed("Checkout", "Add item to cart", TestResultStatus.Passed),
      ];

      const run = await repo.createRunWithResults(
        projectId,
        "Sprint 1",
        "staging",
        TestRunStatus.Completed,
        cases,
        USER_A,
      );

      expect(run.name).toBe("Sprint 1");
      expect(run.environment).toBe("staging");
      expect(run.status).toBe(TestRunStatus.Completed);
      expect(run.projectId).toBe(projectId);

      const suites = await prisma.testSuite.findMany({
        where: { projectId },
        select: { name: true },
      });
      expect(suites.map((suite) => suite.name).toSorted()).toEqual([
        "Auth Suite",
        "Checkout",
      ]);

      const results = await prisma.testResult.findMany({
        where: { testRunId: run.id },
        select: { status: true },
      });
      expect(results).toHaveLength(3);
    });

    it("reuses an existing suite by name instead of creating a duplicate", async () => {
      await prisma.testSuite.create({
        data: { name: "Auth Suite", projectId },
      });

      await repo.createRunWithResults(
        projectId,
        "Import",
        "staging",
        TestRunStatus.Completed,
        [parsed("Auth Suite", "Login test")],
      );

      const suites = await prisma.testSuite.findMany({
        where: { projectId, name: "Auth Suite" },
        select: { id: true },
      });
      expect(suites).toHaveLength(1);
    });

    it("reuses an existing test case by name+suite instead of creating a duplicate", async () => {
      const suite = await prisma.testSuite.create({
        data: { name: "Auth Suite", projectId },
        select: { id: true },
      });
      await prisma.testCase.create({
        data: { name: "Login test", suiteId: suite.id },
      });

      await repo.createRunWithResults(
        projectId,
        "Import",
        "staging",
        TestRunStatus.Completed,
        [parsed("Auth Suite", "Login test")],
      );

      const cases = await prisma.testCase.findMany({
        where: { suiteId: suite.id, name: "Login test" },
        select: { id: true },
      });
      expect(cases).toHaveLength(1);
    });

    it("deduplicates cases with the same suiteName+caseName and keeps only one result per pair", async () => {
      const cases: ParsedTestCase[] = [
        {
          suiteName: "Suite",
          caseName: "Flaky Test",
          status: TestResultStatus.Failed,
          notes: "attempt 1",
        },
        {
          suiteName: "Suite",
          caseName: "Flaky Test",
          status: TestResultStatus.Passed,
          notes: "attempt 2",
        },
      ];

      const run = await repo.createRunWithResults(
        projectId,
        "Retry Run",
        "staging",
        TestRunStatus.Completed,
        cases,
      );

      const results = await prisma.testResult.findMany({
        where: { testRunId: run.id },
        select: { status: true, notes: true },
      });
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe(TestResultStatus.Passed);
      expect(results[0].notes).toBe("attempt 2");
    });

    it("stores notes on results when provided", async () => {
      const cases: ParsedTestCase[] = [
        {
          suiteName: "Suite",
          caseName: "Failing Test",
          status: TestResultStatus.Failed,
          notes: "NullPointerException at line 42",
        },
      ];

      const run = await repo.createRunWithResults(
        projectId,
        "Import",
        "prod",
        TestRunStatus.Completed,
        cases,
      );

      const result = await prisma.testResult.findFirstOrThrow({
        where: { testRunId: run.id },
        select: { notes: true },
      });
      expect(result.notes).toBe("NullPointerException at line 42");
    });

    it("stores the executedById when a userId is provided", async () => {
      const run = await repo.createRunWithResults(
        projectId,
        "Import",
        "staging",
        TestRunStatus.Completed,
        [parsed("Suite", "TC")],
        USER_A,
      );

      const dbRun = await prisma.testRun.findUniqueOrThrow({
        where: { id: run.id },
        select: { executedById: true },
      });
      expect(dbRun.executedById).toBe(USER_A);
    });

    it("handles multiple suites with cases sharing the same name", async () => {
      const cases: ParsedTestCase[] = [
        parsed("Suite A", "Common Name"),
        parsed("Suite B", "Common Name"),
      ];

      const run = await repo.createRunWithResults(
        projectId,
        "Import",
        "staging",
        TestRunStatus.Completed,
        cases,
      );

      const results = await prisma.testResult.findMany({
        where: { testRunId: run.id },
        select: { id: true },
      });
      expect(results).toHaveLength(2);
    });

    it("creates steps for a new test case when provided", async () => {
      const cases: ParsedTestCase[] = [
        {
          suiteName: "Suite",
          caseName: "Component > given state > does thing",
          status: TestResultStatus.Passed,
          notes: null,
          steps: [
            {
              order: 1,
              action: "Component > given state",
              expectedResult: "does thing",
            },
          ],
        },
      ];

      await repo.createRunWithResults(
        projectId,
        "Import",
        "ci",
        TestRunStatus.Completed,
        cases,
      );

      const testCase = await prisma.testCase.findFirstOrThrow({
        where: { name: "Component > given state > does thing" },
        include: { steps: true },
      });
      expect(testCase.steps).toHaveLength(1);
      expect(testCase.steps[0].action).toBe("Component > given state");
      expect(testCase.steps[0].expectedResult).toBe("does thing");
    });

    it("does not create steps for an existing test case", async () => {
      const suite = await prisma.testSuite.create({
        data: { name: "Suite", projectId },
        select: { id: true },
      });
      await prisma.testCase.create({
        data: { name: "Existing Test", suiteId: suite.id },
      });

      await repo.createRunWithResults(
        projectId,
        "Import",
        "ci",
        TestRunStatus.Completed,
        [
          {
            suiteName: "Suite",
            caseName: "Existing Test",
            status: TestResultStatus.Passed,
            notes: null,
            steps: [{ order: 1, action: "action", expectedResult: "result" }],
          },
        ],
      );

      const testCase = await prisma.testCase.findFirstOrThrow({
        where: { name: "Existing Test", suiteId: suite.id },
        include: { steps: true },
      });
      expect(testCase.steps).toHaveLength(0);
    });
  });
});
