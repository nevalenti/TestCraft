import { PrismaPg } from "@prisma/adapter-pg";
import { TestCasePriority } from "@testcraft/types";
import { inject } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import { TestCaseRepository } from "@/infrastructure/repositories/test-case.repository";

const USER_A = "a0000000-0000-0000-0000-000000000001";

describe("TestCaseRepository #integration", { tags: ["integration"] }, () => {
  let prisma: PrismaClient;
  let repo: TestCaseRepository;
  let projectId: string;
  let suiteId: string;

  beforeAll(async () => {
    const databaseUrl = inject("databaseUrl");
    const adapter = new PrismaPg({ connectionString: databaseUrl });

    prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    repo = new TestCaseRepository(prisma);
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
    const suite = await prisma.testSuite.create({
      data: { name: "Suite A", projectId },
      select: { id: true },
    });

    suiteId = suite.id;
  });

  describe("create", () => {
    it("persists a test case and returns it with stepCount zero", async () => {
      const tc = await repo.create(suiteId, {
        name: "Login with valid creds",
        priority: TestCasePriority.High,
      });

      expect(tc.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(tc.name).toBe("Login with valid creds");
      expect(tc.priority).toBe(TestCasePriority.High);
      expect(tc.suiteId).toBe(suiteId);
      expect(tc.stepCount).toBe(0);
      expect(tc.description).toBeNull();
    });

    it("defaults priority to Medium when not provided", async () => {
      const tc = await repo.create(suiteId, { name: "Default priority" });

      expect(tc.priority).toBe(TestCasePriority.Medium);
    });
  });

  describe("getAll", () => {
    it("returns non-deleted cases for the suite", async () => {
      await repo.create(suiteId, { name: "TC-1" });
      await repo.create(suiteId, { name: "TC-2" });

      const { items, total } = await repo.getAll(suiteId);

      expect(total).toBe(2);
      expect(items.map((tc) => tc.name).toSorted()).toEqual(["TC-1", "TC-2"]);
    });

    it("excludes soft-deleted cases", async () => {
      const tc = await repo.create(suiteId, { name: "Gone" });

      await repo.delete(suiteId, tc.id);

      const { total } = await repo.getAll(suiteId);

      expect(total).toBe(0);
    });

    it("filters by search term case-insensitively", async () => {
      await repo.create(suiteId, { name: "Login Test" });
      await repo.create(suiteId, { name: "Logout Test" });
      await repo.create(suiteId, { name: "Dashboard" });

      const { items, total } = await repo.getAll(suiteId, "test");

      expect(total).toBe(2);
      expect(items.every((tc) => tc.name.toLowerCase().includes("test"))).toBe(
        true,
      );
    });

    it("paginates results correctly", async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.create(suiteId, { name: `TC-${i}` });
      }

      const page1 = await repo.getAll(suiteId, undefined, {
        page: 1,
        pageSize: 2,
      });
      const page2 = await repo.getAll(suiteId, undefined, {
        page: 2,
        pageSize: 2,
      });
      const page3 = await repo.getAll(suiteId, undefined, {
        page: 3,
        pageSize: 2,
      });

      expect(page1.total).toBe(5);
      expect(page1.items).toHaveLength(2);
      expect(page2.items).toHaveLength(2);
      expect(page3.items).toHaveLength(1);
    });
  });

  describe("getAllByProject", () => {
    it("returns cases across all suites in the project", async () => {
      const suite2 = await prisma.testSuite.create({
        data: { name: "Suite B", projectId },
        select: { id: true },
      });

      await repo.create(suiteId, { name: "Case in A" });
      await repo.create(suite2.id, { name: "Case in B" });

      const { total } = await repo.getAllByProject(projectId);

      expect(total).toBe(2);
    });

    it("does not return cases from a different project", async () => {
      const other = await prisma.project.create({
        data: { name: "Other", userId: USER_A },
        select: { id: true },
      });
      const otherSuite = await prisma.testSuite.create({
        data: { name: "Other Suite", projectId: other.id },
        select: { id: true },
      });

      await repo.create(otherSuite.id, { name: "Not mine" });
      await repo.create(suiteId, { name: "Mine" });

      const { total } = await repo.getAllByProject(projectId);

      expect(total).toBe(1);
    });

    it("filters by search term across all suites", async () => {
      await repo.create(suiteId, { name: "API Login" });
      await repo.create(suiteId, { name: "UI Checkout" });

      const { total } = await repo.getAllByProject(projectId, "api");

      expect(total).toBe(1);
    });
  });

  describe("getById", () => {
    it("returns the case when it belongs to the suite", async () => {
      const created = await repo.create(suiteId, { name: "My Case" });
      const found = await repo.getById(suiteId, created.id);

      expect(found?.id).toBe(created.id);
    });

    it("returns null for a case in a different suite", async () => {
      const otherSuite = await prisma.testSuite.create({
        data: { name: "Other Suite", projectId },
        select: { id: true },
      });
      const tc = await repo.create(otherSuite.id, { name: "Theirs" });

      expect(await repo.getById(suiteId, tc.id)).toBeNull();
    });

    it("returns null for a soft-deleted case", async () => {
      const tc = await repo.create(suiteId, { name: "Gone" });

      await repo.delete(suiteId, tc.id);
      expect(await repo.getById(suiteId, tc.id)).toBeNull();
    });

    it("returns null for a non-existent id", async () => {
      expect(
        await repo.getById(suiteId, "00000000-0000-0000-0000-000000000000"),
      ).toBeNull();
    });
  });

  describe("update", () => {
    it("updates name, description, and priority", async () => {
      const tc = await repo.create(suiteId, { name: "Original" });
      const updated = await repo.update(suiteId, tc.id, {
        name: "Renamed",
        description: "New desc",
        priority: TestCasePriority.Critical,
      });

      expect(updated?.name).toBe("Renamed");
      expect(updated?.description).toBe("New desc");
      expect(updated?.priority).toBe(TestCasePriority.Critical);
    });

    it("returns null when the case does not exist", async () => {
      expect(
        await repo.update(suiteId, "00000000-0000-0000-0000-000000000000", {
          name: "X",
        }),
      ).toBeNull();
    });

    it("returns null when updating a case in a different suite", async () => {
      const otherSuite = await prisma.testSuite.create({
        data: { name: "Other Suite", projectId },
        select: { id: true },
      });
      const tc = await repo.create(otherSuite.id, { name: "Theirs" });

      expect(await repo.update(suiteId, tc.id, { name: "Hijack" })).toBeNull();
    });
  });

  describe("delete", () => {
    it("soft-deletes the case and returns true", async () => {
      const tc = await repo.create(suiteId, { name: "To delete" });

      expect(await repo.delete(suiteId, tc.id)).toBe(true);

      const raw = await prisma.testCase.findUnique({ where: { id: tc.id } });

      expect(raw?.isDeleted).toBe(true);
      expect(raw?.deletedAt).not.toBeNull();
    });

    it("returns false when the case does not exist", async () => {
      expect(
        await repo.delete(suiteId, "00000000-0000-0000-0000-000000000000"),
      ).toBe(false);
    });

    it("returns false on a second delete attempt", async () => {
      const tc = await repo.create(suiteId, { name: "Double-delete" });

      await repo.delete(suiteId, tc.id);
      expect(await repo.delete(suiteId, tc.id)).toBe(false);
    });
  });
});
