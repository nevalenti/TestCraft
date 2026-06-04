import { PrismaPg } from "@prisma/adapter-pg";
import { TestResultStatus, TestRunStatus } from "@testcraft/types";
import { inject } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import { TestResultRepository } from "@/infrastructure/repositories/test-result.repository";

const USER_A = "a0000000-0000-0000-0000-000000000001";

describe("TestResultRepository #integration", { tags: ["integration"] }, () => {
  let prisma: PrismaClient;
  let repo: TestResultRepository;
  let runId: string;
  let caseId: string;
  let suiteId: string;

  beforeAll(async () => {
    const databaseUrl = inject("databaseUrl");
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    repo = new TestResultRepository(prisma);
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
    const suite = await prisma.testSuite.create({
      data: { name: "Suite", projectId: project.id },
      select: { id: true },
    });
    suiteId = suite.id;
    const tc = await prisma.testCase.create({
      data: { name: "My Test Case", suiteId: suite.id },
      select: { id: true },
    });
    caseId = tc.id;
    const run = await prisma.testRun.create({
      data: {
        name: "Sprint Run",
        environment: "staging",
        status: TestRunStatus.Active,
        projectId: project.id,
      },
      select: { id: true },
    });
    runId = run.id;
  });

  describe("create", () => {
    it("persists a result and returns it with testCaseName and suiteId", async () => {
      const result = await repo.create(runId, {
        testCaseId: caseId,
        status: TestResultStatus.Passed,
        executedAt: new Date("2025-01-01T10:00:00Z"),
      });

      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(result.testRunId).toBe(runId);
      expect(result.testCaseId).toBe(caseId);
      expect(result.status).toBe(TestResultStatus.Passed);
      expect(result.testCaseName).toBe("My Test Case");
      expect(result.suiteId).toBe(suiteId);
      expect(result.notes).toBeNull();
      expect(result.executedById).toBeNull();
    });

    it("stores notes and executedById when provided", async () => {
      const result = await repo.create(
        runId,
        {
          testCaseId: caseId,
          status: TestResultStatus.Failed,
          notes: "Error in step 3",
          executedAt: new Date(),
        },
        USER_A,
      );

      expect(result.notes).toBe("Error in step 3");
      expect(result.executedById).toBe(USER_A);
    });
  });

  describe("getAll", () => {
    it("returns all non-deleted results for the run", async () => {
      const tc2 = await prisma.testCase.create({
        data: { name: "TC2", suiteId },
        select: { id: true },
      });
      const now = new Date();
      await repo.create(runId, {
        testCaseId: caseId,
        status: TestResultStatus.Passed,
        executedAt: now,
      });
      await repo.create(runId, {
        testCaseId: tc2.id,
        status: TestResultStatus.Failed,
        executedAt: now,
      });

      const { total } = await repo.getAll(runId);
      expect(total).toBe(2);
    });

    it("filters by status", async () => {
      const tc2 = await prisma.testCase.create({
        data: { name: "TC2", suiteId },
        select: { id: true },
      });
      const now = new Date();
      await repo.create(runId, {
        testCaseId: caseId,
        status: TestResultStatus.Passed,
        executedAt: now,
      });
      await repo.create(runId, {
        testCaseId: tc2.id,
        status: TestResultStatus.Failed,
        executedAt: now,
      });

      const { items, total } = await repo.getAll(
        runId,
        TestResultStatus.Passed,
      );
      expect(total).toBe(1);
      expect(items[0].status).toBe(TestResultStatus.Passed);
    });

    it("excludes soft-deleted results", async () => {
      const result = await repo.create(runId, {
        testCaseId: caseId,
        status: TestResultStatus.Passed,
        executedAt: new Date(),
      });
      await repo.delete(runId, result.id);

      const { total } = await repo.getAll(runId);
      expect(total).toBe(0);
    });

    it("paginates results correctly", async () => {
      const cases = await Promise.all(
        ["TC1", "TC2", "TC3", "TC4"].map((name) =>
          prisma.testCase.create({
            data: { name, suiteId },
            select: { id: true },
          }),
        ),
      );
      const now = new Date();
      for (const tc of cases) {
        await repo.create(runId, {
          testCaseId: tc.id,
          status: TestResultStatus.Passed,
          executedAt: now,
        });
      }

      const page1 = await repo.getAll(runId, undefined, {
        page: 1,
        pageSize: 2,
      });
      const page2 = await repo.getAll(runId, undefined, {
        page: 2,
        pageSize: 2,
      });

      expect(page1.total).toBe(4);
      expect(page1.items).toHaveLength(2);
      expect(page2.items).toHaveLength(2);
    });
  });

  describe("getById", () => {
    it("returns the result when it belongs to the run", async () => {
      const created = await repo.create(runId, {
        testCaseId: caseId,
        status: TestResultStatus.Passed,
        executedAt: new Date(),
      });
      const found = await repo.getById(runId, created.id);
      expect(found?.id).toBe(created.id);
    });

    it("returns null for a soft-deleted result", async () => {
      const result = await repo.create(runId, {
        testCaseId: caseId,
        status: TestResultStatus.Passed,
        executedAt: new Date(),
      });
      await repo.delete(runId, result.id);
      expect(await repo.getById(runId, result.id)).toBeNull();
    });

    it("returns null for a non-existent id", async () => {
      expect(
        await repo.getById(runId, "00000000-0000-0000-0000-000000000000"),
      ).toBeNull();
    });
  });

  describe("update", () => {
    it("updates status and notes", async () => {
      const result = await repo.create(runId, {
        testCaseId: caseId,
        status: TestResultStatus.Passed,
        executedAt: new Date(),
      });
      const updated = await repo.update(runId, result.id, {
        status: TestResultStatus.Failed,
        notes: "Regression found",
      });
      expect(updated?.status).toBe(TestResultStatus.Failed);
      expect(updated?.notes).toBe("Regression found");
    });

    it("returns null when the result does not exist", async () => {
      expect(
        await repo.update(runId, "00000000-0000-0000-0000-000000000000", {
          status: TestResultStatus.Passed,
        }),
      ).toBeNull();
    });
  });

  describe("delete", () => {
    it("soft-deletes the result and returns true", async () => {
      const result = await repo.create(runId, {
        testCaseId: caseId,
        status: TestResultStatus.Passed,
        executedAt: new Date(),
      });
      expect(await repo.delete(runId, result.id)).toBe(true);

      const raw = await prisma.testResult.findUnique({
        where: { id: result.id },
      });
      expect(raw?.isDeleted).toBe(true);
      expect(raw?.deletedAt).not.toBeNull();
    });

    it("returns false when the result does not exist", async () => {
      expect(
        await repo.delete(runId, "00000000-0000-0000-0000-000000000000"),
      ).toBe(false);
    });

    it("returns false on a second delete attempt", async () => {
      const result = await repo.create(runId, {
        testCaseId: caseId,
        status: TestResultStatus.Passed,
        executedAt: new Date(),
      });
      await repo.delete(runId, result.id);
      expect(await repo.delete(runId, result.id)).toBe(false);
    });
  });
});
