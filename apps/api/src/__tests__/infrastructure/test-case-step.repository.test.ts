import { PrismaPg } from "@prisma/adapter-pg";
import { inject } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import { TestCaseStepRepository } from "@/infrastructure/repositories/test-case-step.repository";

const USER_A = "a0000000-0000-0000-0000-000000000001";

describe(
  "TestCaseStepRepository #integration",
  { tags: ["integration"] },
  () => {
    let prisma: PrismaClient;
    let repo: TestCaseStepRepository;
    let caseId: string;

    beforeAll(async () => {
      const databaseUrl = inject("databaseUrl");
      const adapter = new PrismaPg({ connectionString: databaseUrl });

      prisma = new PrismaClient({ adapter });
      await prisma.$connect();
      repo = new TestCaseStepRepository(prisma);
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    beforeEach(async () => {
      await prisma.$executeRaw`TRUNCATE TABLE projects CASCADE`;
      const project = await prisma.project.create({
        data: { name: "P", userId: USER_A },
        select: { id: true },
      });
      const suite = await prisma.testSuite.create({
        data: { name: "S", projectId: project.id },
        select: { id: true },
      });
      const tc = await prisma.testCase.create({
        data: { name: "TC", suiteId: suite.id },
        select: { id: true },
      });

      caseId = tc.id;
    });

    describe("create", () => {
      it("persists a step and returns it with correct fields", async () => {
        const step = await repo.create(caseId, {
          order: 1,
          action: "Open the login page",
          expectedResult: "Login form is visible",
        });

        expect(step.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
        expect(step.testCaseId).toBe(caseId);
        expect(step.order).toBe(1);
        expect(step.action).toBe("Open the login page");
        expect(step.expectedResult).toBe("Login form is visible");
      });
    });

    describe("getAll", () => {
      it("returns steps ordered by order ascending", async () => {
        await repo.create(caseId, {
          order: 3,
          action: "C",
          expectedResult: "c",
        });
        await repo.create(caseId, {
          order: 1,
          action: "A",
          expectedResult: "a",
        });
        await repo.create(caseId, {
          order: 2,
          action: "B",
          expectedResult: "b",
        });

        const { items } = await repo.getAll(caseId);

        expect(items.map((step) => step.order)).toEqual([1, 2, 3]);
      });

      it("excludes soft-deleted steps", async () => {
        const step = await repo.create(caseId, {
          order: 1,
          action: "Gone",
          expectedResult: "gone",
        });

        await repo.delete(caseId, step.id);

        const { total } = await repo.getAll(caseId);

        expect(total).toBe(0);
      });

      it("paginates results correctly", async () => {
        for (let i = 1; i <= 4; i++) {
          await repo.create(caseId, {
            order: i,
            action: `Step ${i}`,
            expectedResult: `Result ${i}`,
          });
        }

        const page1 = await repo.getAll(caseId, { page: 1, pageSize: 2 });
        const page2 = await repo.getAll(caseId, { page: 2, pageSize: 2 });

        expect(page1.total).toBe(4);
        expect(page1.items).toHaveLength(2);
        expect(page2.items).toHaveLength(2);
      });
    });

    describe("findByIds", () => {
      it("returns only the matching steps within the case", async () => {
        const s1 = await repo.create(caseId, {
          order: 1,
          action: "A",
          expectedResult: "a",
        });
        const s2 = await repo.create(caseId, {
          order: 2,
          action: "B",
          expectedResult: "b",
        });

        const found = await repo.findByIds(caseId, [s1.id]);

        expect(found).toHaveLength(1);
        expect(found[0].id).toBe(s1.id);
        expect(found.map((step) => step.id)).not.toContain(s2.id);
      });

      it("does not return steps from a different case", async () => {
        const parentCase = await prisma.testCase.findUniqueOrThrow({
          where: { id: caseId },
          select: { suiteId: true },
        });
        const otherCase = await prisma.testCase.create({
          data: { name: "Other TC", suiteId: parentCase.suiteId },
          select: { id: true },
        });
        const step = await repo.create(otherCase.id, {
          order: 1,
          action: "X",
          expectedResult: "x",
        });

        const found = await repo.findByIds(caseId, [step.id]);

        expect(found).toHaveLength(0);
      });

      it("returns an empty array when ids list is empty", async () => {
        const found = await repo.findByIds(caseId, []);

        expect(found).toHaveLength(0);
      });
    });

    describe("getById", () => {
      it("returns the step when it belongs to the case", async () => {
        const created = await repo.create(caseId, {
          order: 1,
          action: "A",
          expectedResult: "a",
        });
        const found = await repo.getById(caseId, created.id);

        expect(found?.id).toBe(created.id);
      });

      it("returns null for a soft-deleted step", async () => {
        const step = await repo.create(caseId, {
          order: 1,
          action: "Gone",
          expectedResult: "gone",
        });

        await repo.delete(caseId, step.id);
        expect(await repo.getById(caseId, step.id)).toBeNull();
      });

      it("returns null for a non-existent id", async () => {
        expect(
          await repo.getById(caseId, "00000000-0000-0000-0000-000000000000"),
        ).toBeNull();
      });
    });

    describe("update", () => {
      it("updates action, expectedResult, and order", async () => {
        const step = await repo.create(caseId, {
          order: 1,
          action: "Original",
          expectedResult: "orig",
        });
        const updated = await repo.update(caseId, step.id, {
          order: 5,
          action: "Updated",
          expectedResult: "updated",
        });

        expect(updated?.action).toBe("Updated");
        expect(updated?.expectedResult).toBe("updated");
        expect(updated?.order).toBe(5);
      });

      it("returns null when the step does not exist", async () => {
        expect(
          await repo.update(caseId, "00000000-0000-0000-0000-000000000000", {
            order: 1,
            action: "X",
            expectedResult: "x",
          }),
        ).toBeNull();
      });
    });

    describe("bulkReorder", () => {
      it("updates the order of multiple steps in one transaction", async () => {
        const s1 = await repo.create(caseId, {
          order: 1,
          action: "A",
          expectedResult: "a",
        });
        const s2 = await repo.create(caseId, {
          order: 2,
          action: "B",
          expectedResult: "b",
        });
        const s3 = await repo.create(caseId, {
          order: 3,
          action: "C",
          expectedResult: "c",
        });

        await repo.bulkReorder(caseId, [
          { id: s1.id, order: 3 },
          { id: s2.id, order: 1 },
          { id: s3.id, order: 2 },
        ]);

        const { items } = await repo.getAll(caseId);
        const orderMap = Object.fromEntries(
          items.map((step) => [step.id, step.order]),
        );

        expect(orderMap[s1.id]).toBe(3);
        expect(orderMap[s2.id]).toBe(1);
        expect(orderMap[s3.id]).toBe(2);
      });
    });

    describe("delete", () => {
      it("soft-deletes the step and returns true", async () => {
        const step = await repo.create(caseId, {
          order: 1,
          action: "To delete",
          expectedResult: "deleted",
        });

        expect(await repo.delete(caseId, step.id)).toBe(true);

        const raw = await prisma.testCaseStep.findUnique({
          where: { id: step.id },
        });

        expect(raw?.isDeleted).toBe(true);
        expect(raw?.deletedAt).not.toBeNull();
      });

      it("returns false when the step does not exist", async () => {
        expect(
          await repo.delete(caseId, "00000000-0000-0000-0000-000000000000"),
        ).toBe(false);
      });

      it("returns false on a second delete attempt", async () => {
        const step = await repo.create(caseId, {
          order: 1,
          action: "Double",
          expectedResult: "double",
        });

        await repo.delete(caseId, step.id);
        expect(await repo.delete(caseId, step.id)).toBe(false);
      });
    });
  },
);
