import { PrismaPg } from "@prisma/adapter-pg";
import { inject } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import { ProjectRepository } from "@/infrastructure/repositories/project.repository";

const USER_A = "a0000000-0000-0000-0000-000000000001";
const USER_B = "a0000000-0000-0000-0000-000000000002";

describe("ProjectRepository #integration", { tags: ["integration"] }, () => {
  let prisma: PrismaClient;
  let repo: ProjectRepository;

  beforeAll(async () => {
    const databaseUrl = inject("databaseUrl");
    const adapter = new PrismaPg({ connectionString: databaseUrl });

    prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    repo = new ProjectRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE projects CASCADE`;
  });

  describe("create", () => {
    it("persists the project and returns it with computed counts", async () => {
      const project = await repo.create(USER_A, {
        name: "Alpha",
        description: "First project",
      });

      expect(project.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(project.name).toBe("Alpha");
      expect(project.description).toBe("First project");
      expect(project.userId).toBe(USER_A);
      expect(project.suiteCount).toBe(0);
      expect(project.runCount).toBe(0);
    });

    it("stores a null description when omitted", async () => {
      const project = await repo.create(USER_A, { name: "No desc" });

      expect(project.description).toBeNull();
    });
  });

  describe("getAll", () => {
    it("returns only the requesting user's non-deleted projects", async () => {
      await repo.create(USER_A, { name: "A-1" });
      await repo.create(USER_A, { name: "A-2" });
      const b = await repo.create(USER_B, { name: "B-1" });

      await repo.delete(USER_B, b.id);

      const { items, total } = await repo.getAll(USER_A);

      expect(total).toBe(2);
      expect(items.map((project) => project.name).toSorted()).toEqual([
        "A-1",
        "A-2",
      ]);
    });

    it("does not return soft-deleted projects", async () => {
      const p = await repo.create(USER_A, { name: "Gone" });

      await repo.delete(USER_A, p.id);

      const { total } = await repo.getAll(USER_A);

      expect(total).toBe(0);
    });

    it("filters by search term case-insensitively", async () => {
      await repo.create(USER_A, { name: "Frontend Tests" });
      await repo.create(USER_A, { name: "Backend Tests" });
      await repo.create(USER_A, { name: "Mobile" });

      const { items, total } = await repo.getAll(USER_A, "tests");

      expect(total).toBe(2);
      expect(
        items.every((project) => project.name.toLowerCase().includes("tests")),
      ).toBe(true);
    });

    it("paginates correctly", async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.create(USER_A, { name: `Project ${i}` });
      }

      const page1 = await repo.getAll(USER_A, undefined, {
        page: 1,
        pageSize: 2,
      });
      const page2 = await repo.getAll(USER_A, undefined, {
        page: 2,
        pageSize: 2,
      });
      const page3 = await repo.getAll(USER_A, undefined, {
        page: 3,
        pageSize: 2,
      });

      expect(page1.total).toBe(5);
      expect(page1.items).toHaveLength(2);
      expect(page2.items).toHaveLength(2);
      expect(page3.items).toHaveLength(1);

      const allIds = [...page1.items, ...page2.items, ...page3.items].map(
        (project) => project.id,
      );

      expect(new Set(allIds).size).toBe(5);
    });

    it("returns an empty page when there are no projects", async () => {
      const result = await repo.getAll(USER_A);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("getById", () => {
    it("returns the project when it belongs to the user", async () => {
      const created = await repo.create(USER_A, { name: "Mine" });
      const found = await repo.getById(USER_A, created.id);

      expect(found?.id).toBe(created.id);
    });

    it("returns null for another user's project", async () => {
      const p = await repo.create(USER_B, { name: "Not mine" });

      expect(await repo.getById(USER_A, p.id)).toBeNull();
    });

    it("returns null for a soft-deleted project", async () => {
      const p = await repo.create(USER_A, { name: "Deleted" });

      await repo.delete(USER_A, p.id);
      expect(await repo.getById(USER_A, p.id)).toBeNull();
    });

    it("returns null for a non-existent id", async () => {
      expect(
        await repo.getById(USER_A, "00000000-0000-0000-0000-000000000000"),
      ).toBeNull();
    });
  });

  describe("update", () => {
    it("updates name and description and returns the updated project", async () => {
      const p = await repo.create(USER_A, { name: "Original" });
      const updated = await repo.update(USER_A, p.id, {
        name: "Renamed",
        description: "New desc",
      });

      expect(updated?.name).toBe("Renamed");
      expect(updated?.description).toBe("New desc");
    });

    it("returns null when the project does not exist", async () => {
      expect(
        await repo.update(USER_A, "00000000-0000-0000-0000-000000000000", {
          name: "X",
        }),
      ).toBeNull();
    });

    it("returns null when updating another user's project", async () => {
      const p = await repo.create(USER_B, { name: "B project" });

      expect(await repo.update(USER_A, p.id, { name: "Hijack" })).toBeNull();
    });
  });

  describe("delete", () => {
    it("soft-deletes the project and returns true", async () => {
      const p = await repo.create(USER_A, { name: "To delete" });

      expect(await repo.delete(USER_A, p.id)).toBe(true);

      const raw = await prisma.project.findUnique({ where: { id: p.id } });

      expect(raw?.isDeleted).toBe(true);
      expect(raw?.deletedAt).not.toBeNull();
    });

    it("returns false when the project does not exist", async () => {
      expect(
        await repo.delete(USER_A, "00000000-0000-0000-0000-000000000000"),
      ).toBe(false);
    });

    it("returns false on a second delete attempt", async () => {
      const p = await repo.create(USER_A, { name: "Double-delete" });

      await repo.delete(USER_A, p.id);
      expect(await repo.delete(USER_A, p.id)).toBe(false);
    });

    it("returns false when deleting another user's project", async () => {
      const p = await repo.create(USER_B, { name: "B project" });

      expect(await repo.delete(USER_A, p.id)).toBe(false);
    });
  });
});
