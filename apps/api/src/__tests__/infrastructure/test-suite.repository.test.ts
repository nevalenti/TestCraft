import { PrismaPg } from "@prisma/adapter-pg";
import { inject } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import { TestSuiteRepository } from "@/infrastructure/repositories/test-suite.repository";

const USER_A = "a0000000-0000-0000-0000-000000000001";

describe("TestSuiteRepository #integration", { tags: ["integration"] }, () => {
  let prisma: PrismaClient;
  let repo: TestSuiteRepository;
  let projectId: string;

  beforeAll(async () => {
    const databaseUrl = inject("databaseUrl");
    const adapter = new PrismaPg({ connectionString: databaseUrl });

    prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    repo = new TestSuiteRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE projects CASCADE`;
    const project = await prisma.project.create({
      data: { name: "Test Project", userId: USER_A },
      select: { id: true },
    });

    projectId = project.id;
  });

  describe("create", () => {
    it("persists a suite and returns it with correct fields", async () => {
      const suite = await repo.create(projectId, {
        name: "Login Tests",
        description: "Auth scenarios",
      });

      expect(suite.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(suite.name).toBe("Login Tests");
      expect(suite.description).toBe("Auth scenarios");
      expect(suite.projectId).toBe(projectId);
    });

    it("stores a null description when omitted", async () => {
      const suite = await repo.create(projectId, { name: "No desc" });

      expect(suite.description).toBeNull();
    });
  });

  describe("getAll", () => {
    it("returns all non-deleted suites for the project", async () => {
      await repo.create(projectId, { name: "A" });
      await repo.create(projectId, { name: "B" });

      const { items, total } = await repo.getAll(projectId);

      expect(total).toBe(2);
      expect(items.map((suite) => suite.name).toSorted()).toEqual(["A", "B"]);
    });

    it("excludes soft-deleted suites", async () => {
      const suite = await repo.create(projectId, { name: "Gone" });

      await repo.delete(projectId, suite.id);

      const { total } = await repo.getAll(projectId);

      expect(total).toBe(0);
    });

    it("does not return suites from a different project", async () => {
      const other = await prisma.project.create({
        data: { name: "Other", userId: USER_A },
        select: { id: true },
      });

      await repo.create(other.id, { name: "Other Suite" });
      await repo.create(projectId, { name: "Mine" });

      const { total } = await repo.getAll(projectId);

      expect(total).toBe(1);
    });

    it("paginates results correctly", async () => {
      for (let i = 1; i <= 4; i++) {
        await repo.create(projectId, { name: `Suite ${i}` });
      }

      const page1 = await repo.getAll(projectId, { page: 1, pageSize: 2 });
      const page2 = await repo.getAll(projectId, { page: 2, pageSize: 2 });

      expect(page1.total).toBe(4);
      expect(page1.items).toHaveLength(2);
      expect(page2.items).toHaveLength(2);
      const allIds = [...page1.items, ...page2.items].map((suite) => suite.id);

      expect(new Set(allIds).size).toBe(4);
    });

    it("returns an empty page when there are no suites", async () => {
      const { items, total } = await repo.getAll(projectId);

      expect(items).toHaveLength(0);
      expect(total).toBe(0);
    });
  });

  describe("getById", () => {
    it("returns the suite when it belongs to the project", async () => {
      const created = await repo.create(projectId, { name: "Suite A" });
      const found = await repo.getById(projectId, created.id);

      expect(found?.id).toBe(created.id);
    });

    it("returns null for a suite in a different project", async () => {
      const other = await prisma.project.create({
        data: { name: "Other", userId: USER_A },
        select: { id: true },
      });
      const suite = await repo.create(other.id, { name: "Other Suite" });

      expect(await repo.getById(projectId, suite.id)).toBeNull();
    });

    it("returns null for a soft-deleted suite", async () => {
      const suite = await repo.create(projectId, { name: "Gone" });

      await repo.delete(projectId, suite.id);
      expect(await repo.getById(projectId, suite.id)).toBeNull();
    });

    it("returns null for a non-existent id", async () => {
      expect(
        await repo.getById(projectId, "00000000-0000-0000-0000-000000000000"),
      ).toBeNull();
    });
  });

  describe("update", () => {
    it("updates name and description and returns the updated suite", async () => {
      const suite = await repo.create(projectId, { name: "Original" });
      const updated = await repo.update(projectId, suite.id, {
        name: "Renamed",
        description: "New desc",
      });

      expect(updated?.name).toBe("Renamed");
      expect(updated?.description).toBe("New desc");
    });

    it("returns null when the suite does not exist", async () => {
      expect(
        await repo.update(projectId, "00000000-0000-0000-0000-000000000000", {
          name: "X",
        }),
      ).toBeNull();
    });

    it("returns null when updating a suite in a different project", async () => {
      const other = await prisma.project.create({
        data: { name: "Other", userId: USER_A },
        select: { id: true },
      });
      const suite = await repo.create(other.id, { name: "Theirs" });

      expect(
        await repo.update(projectId, suite.id, { name: "Hijack" }),
      ).toBeNull();
    });
  });

  describe("delete", () => {
    it("soft-deletes the suite and returns true", async () => {
      const suite = await repo.create(projectId, { name: "To delete" });

      expect(await repo.delete(projectId, suite.id)).toBe(true);

      const raw = await prisma.testSuite.findUnique({
        where: { id: suite.id },
      });

      expect(raw?.isDeleted).toBe(true);
      expect(raw?.deletedAt).not.toBeNull();
    });

    it("returns false when the suite does not exist", async () => {
      expect(
        await repo.delete(projectId, "00000000-0000-0000-0000-000000000000"),
      ).toBe(false);
    });

    it("returns false on a second delete attempt", async () => {
      const suite = await repo.create(projectId, { name: "Double-delete" });

      await repo.delete(projectId, suite.id);
      expect(await repo.delete(projectId, suite.id)).toBe(false);
    });
  });
});
