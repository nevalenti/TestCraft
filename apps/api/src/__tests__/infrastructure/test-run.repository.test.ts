import { PrismaPg } from "@prisma/adapter-pg";
import { TestResultStatus, TestRunStatus } from "@testcraft/types";
import { inject } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import { TestRunRepository } from "@/infrastructure/repositories/test-run.repository";

const USER_A = "a0000000-0000-0000-0000-000000000001";

describe("TestRunRepository #integration", { tags: ["integration"] }, () => {
  let prisma: PrismaClient;
  let repo: TestRunRepository;
  let projectId: string;

  beforeAll(async () => {
    const databaseUrl = inject("databaseUrl");
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    repo = new TestRunRepository(prisma);
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

  describe("create", () => {
    it("persists a run and returns it with Active status by default", async () => {
      const run = await repo.create(projectId, {
        name: "Sprint 12 Regression",
        environment: "staging",
        status: TestRunStatus.Active,
      });

      expect(run.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(run.name).toBe("Sprint 12 Regression");
      expect(run.environment).toBe("staging");
      expect(run.status).toBe(TestRunStatus.Active);
      expect(run.projectId).toBe(projectId);
    });
  });

  describe("findById", () => {
    it("returns the run regardless of project when it exists", async () => {
      const run = await repo.create(projectId, {
        name: "Run",
        environment: "prod",
        status: TestRunStatus.Active,
      });
      const found = await repo.findById(run.id);
      expect(found?.id).toBe(run.id);
    });

    it("returns null for a soft-deleted run", async () => {
      const run = await repo.create(projectId, {
        name: "Gone",
        environment: "prod",
        status: TestRunStatus.Active,
      });
      await repo.delete(projectId, run.id);
      expect(await repo.findById(run.id)).toBeNull();
    });

    it("returns null for a non-existent id", async () => {
      expect(
        await repo.findById("00000000-0000-0000-0000-000000000000"),
      ).toBeNull();
    });
  });

  describe("getAll", () => {
    it("returns all non-deleted runs for the project", async () => {
      await repo.create(projectId, {
        name: "Run A",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      await repo.create(projectId, {
        name: "Run B",
        environment: "prod",
        status: TestRunStatus.Completed,
      });

      const { items, total } = await repo.getAll(projectId);
      expect(total).toBe(2);
      expect(items.map((run) => run.name).toSorted()).toEqual([
        "Run A",
        "Run B",
      ]);
    });

    it("excludes soft-deleted runs", async () => {
      const run = await repo.create(projectId, {
        name: "Gone",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      await repo.delete(projectId, run.id);

      const { total } = await repo.getAll(projectId);
      expect(total).toBe(0);
    });

    it("does not return runs from a different project", async () => {
      const other = await prisma.project.create({
        data: { name: "Other", userId: USER_A },
        select: { id: true },
      });
      await repo.create(other.id, {
        name: "Other Run",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      await repo.create(projectId, {
        name: "My Run",
        environment: "staging",
        status: TestRunStatus.Active,
      });

      const { total } = await repo.getAll(projectId);
      expect(total).toBe(1);
    });

    it("paginates results correctly", async () => {
      for (let i = 1; i <= 4; i++) {
        await repo.create(projectId, {
          name: `Run ${i}`,
          environment: "staging",
          status: TestRunStatus.Active,
        });
      }

      const page1 = await repo.getAll(projectId, { page: 1, pageSize: 2 });
      const page2 = await repo.getAll(projectId, { page: 2, pageSize: 2 });

      expect(page1.total).toBe(4);
      expect(page1.items).toHaveLength(2);
      expect(page2.items).toHaveLength(2);
    });
  });

  describe("getById", () => {
    it("returns the run when it belongs to the project", async () => {
      const created = await repo.create(projectId, {
        name: "My Run",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      const found = await repo.getById(projectId, created.id);
      expect(found?.id).toBe(created.id);
    });

    it("returns null for a run in a different project", async () => {
      const other = await prisma.project.create({
        data: { name: "Other", userId: USER_A },
        select: { id: true },
      });
      const run = await repo.create(other.id, {
        name: "Theirs",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      expect(await repo.getById(projectId, run.id)).toBeNull();
    });

    it("returns null for a soft-deleted run", async () => {
      const run = await repo.create(projectId, {
        name: "Gone",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      await repo.delete(projectId, run.id);
      expect(await repo.getById(projectId, run.id)).toBeNull();
    });

    it("returns null for a non-existent id", async () => {
      expect(
        await repo.getById(projectId, "00000000-0000-0000-0000-000000000000"),
      ).toBeNull();
    });
  });

  describe("getSummary", () => {
    it("returns zeroed counts when no results exist", async () => {
      const run = await repo.create(projectId, {
        name: "Empty Run",
        environment: "staging",
        status: TestRunStatus.Active,
      });

      const summary = await repo.getSummary(projectId, run.id);
      expect(summary).toEqual({
        total: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        skipped: 0,
        passRate: 0,
      });
    });

    it("counts results by status and computes passRate", async () => {
      const suite = await prisma.testSuite.create({
        data: { name: "S", projectId },
        select: { id: true },
      });
      const [tc1, tc2, tc3, tc4] = await Promise.all(
        ["TC1", "TC2", "TC3", "TC4"].map((name) =>
          prisma.testCase.create({
            data: { name, suiteId: suite.id },
            select: { id: true },
          }),
        ),
      );
      const run = await repo.create(projectId, {
        name: "Summary Run",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      const now = new Date();
      await prisma.testResult.createMany({
        data: [
          {
            testRunId: run.id,
            testCaseId: tc1.id,
            status: TestResultStatus.Passed,
            executedAt: now,
          },
          {
            testRunId: run.id,
            testCaseId: tc2.id,
            status: TestResultStatus.Passed,
            executedAt: now,
          },
          {
            testRunId: run.id,
            testCaseId: tc3.id,
            status: TestResultStatus.Failed,
            executedAt: now,
          },
          {
            testRunId: run.id,
            testCaseId: tc4.id,
            status: TestResultStatus.Skipped,
            executedAt: now,
          },
        ],
      });

      const summary = await repo.getSummary(projectId, run.id);
      expect(summary?.total).toBe(4);
      expect(summary?.passed).toBe(2);
      expect(summary?.failed).toBe(1);
      expect(summary?.skipped).toBe(1);
      expect(summary?.blocked).toBe(0);
      expect(summary?.passRate).toBe(50);
    });

    it("returns null when the run does not exist", async () => {
      expect(
        await repo.getSummary(
          projectId,
          "00000000-0000-0000-0000-000000000000",
        ),
      ).toBeNull();
    });

    it("returns null for a run in a different project", async () => {
      const other = await prisma.project.create({
        data: { name: "Other", userId: USER_A },
        select: { id: true },
      });
      const run = await repo.create(other.id, {
        name: "Theirs",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      expect(await repo.getSummary(projectId, run.id)).toBeNull();
    });
  });

  describe("update", () => {
    it("updates name, environment, and status", async () => {
      const run = await repo.create(projectId, {
        name: "Original",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      const updated = await repo.update(projectId, run.id, {
        name: "Renamed",
        environment: "prod",
        status: TestRunStatus.Completed,
      });
      expect(updated?.name).toBe("Renamed");
      expect(updated?.environment).toBe("prod");
      expect(updated?.status).toBe(TestRunStatus.Completed);
    });

    it("returns null when the run does not exist", async () => {
      expect(
        await repo.update(projectId, "00000000-0000-0000-0000-000000000000", {
          name: "X",
          environment: "staging",
          status: TestRunStatus.Active,
        }),
      ).toBeNull();
    });

    it("returns null when updating a run in a different project", async () => {
      const other = await prisma.project.create({
        data: { name: "Other", userId: USER_A },
        select: { id: true },
      });
      const run = await repo.create(other.id, {
        name: "Theirs",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      expect(
        await repo.update(projectId, run.id, {
          name: "Hijack",
          environment: "staging",
          status: TestRunStatus.Active,
        }),
      ).toBeNull();
    });
  });

  describe("delete", () => {
    it("soft-deletes the run and returns true", async () => {
      const run = await repo.create(projectId, {
        name: "To delete",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      expect(await repo.delete(projectId, run.id)).toBe(true);

      const raw = await prisma.testRun.findUnique({ where: { id: run.id } });
      expect(raw?.isDeleted).toBe(true);
      expect(raw?.deletedAt).not.toBeNull();
    });

    it("returns false when the run does not exist", async () => {
      expect(
        await repo.delete(projectId, "00000000-0000-0000-0000-000000000000"),
      ).toBe(false);
    });

    it("returns false on a second delete attempt", async () => {
      const run = await repo.create(projectId, {
        name: "Double-delete",
        environment: "staging",
        status: TestRunStatus.Active,
      });
      await repo.delete(projectId, run.id);
      expect(await repo.delete(projectId, run.id)).toBe(false);
    });
  });
});
