import { TestRunStatus } from "@testcraft/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ITestRunRepository } from "@/application/test-runs/test-run.repository";
import { TestRunService } from "@/application/test-runs/test-run.service";
import { DomainError, NotFoundError } from "@/domain/errors";
import { TestRun } from "@/domain/test-run";
import { CacheService } from "@/infrastructure/cache/cache.service";

const makeRun = (status: TestRunStatus): TestRun => ({
  id: "run-1",
  projectId: "proj-1",
  name: "Regression",
  environment: "staging",
  status,
  source: null,
  executedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockRepo: ITestRunRepository = {
  findById: vi.fn(),
  getAll: vi.fn(),
  getById: vi.fn(),
  getSummary: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe("TestRunService #unit", { tags: ["unit"] }, () => {
  let service: TestRunService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TestRunService(mockRepo, new CacheService(null));
  });

  describe("update — status transition validation", () => {
    describe("given a valid forward transition (Active → Completed)", () => {
      it("delegates to the repository and returns the updated run", async () => {
        const current = makeRun(TestRunStatus.Active);
        const updated = { ...current, status: TestRunStatus.Completed };

        vi.mocked(mockRepo.getById).mockResolvedValue(current);
        vi.mocked(mockRepo.update).mockResolvedValue(updated);

        const result = await service.update("proj-1", "run-1", {
          name: "Regression",
          environment: "staging",
          status: TestRunStatus.Completed,
        });

        expect(result).toEqual(updated);
        expect(mockRepo.update).toHaveBeenCalledOnce();
      });
    });

    describe("given a valid forward transition (Active → Archived)", () => {
      it("delegates to the repository", async () => {
        vi.mocked(mockRepo.getById).mockResolvedValue(
          makeRun(TestRunStatus.Active),
        );
        vi.mocked(mockRepo.update).mockResolvedValue(
          makeRun(TestRunStatus.Archived),
        );

        await service.update("proj-1", "run-1", {
          name: "Regression",
          environment: "staging",
          status: TestRunStatus.Archived,
        });

        expect(mockRepo.update).toHaveBeenCalledOnce();
      });
    });

    describe("given a backward transition (Completed → Active)", () => {
      it("throws a DomainError without calling the repository", async () => {
        vi.mocked(mockRepo.getById).mockResolvedValue(
          makeRun(TestRunStatus.Completed),
        );

        await expect(
          service.update("proj-1", "run-1", {
            name: "Regression",
            environment: "staging",
            status: TestRunStatus.Active,
          }),
        ).rejects.toThrow(DomainError);

        expect(mockRepo.update).not.toHaveBeenCalled();
      });
    });

    describe("given a backward transition (Archived → Completed)", () => {
      it("throws a DomainError", async () => {
        vi.mocked(mockRepo.getById).mockResolvedValue(
          makeRun(TestRunStatus.Archived),
        );

        await expect(
          service.update("proj-1", "run-1", {
            name: "Regression",
            environment: "staging",
            status: TestRunStatus.Completed,
          }),
        ).rejects.toThrow(DomainError);
      });
    });

    describe("given the run does not exist", () => {
      it("throws NotFoundError without calling repository.update", async () => {
        vi.mocked(mockRepo.getById).mockResolvedValue(null);

        await expect(
          service.update("proj-1", "missing", {
            name: "Regression",
            environment: "staging",
            status: TestRunStatus.Completed,
          }),
        ).rejects.toThrow(NotFoundError);

        expect(mockRepo.update).not.toHaveBeenCalled();
      });
    });
  });

  describe("getAll — delegates to the repository", () => {
    it("passes projectId and pagination through unchanged", async () => {
      const paginated = { items: [], total: 0, page: 1, pageSize: 50 };

      vi.mocked(mockRepo.getAll).mockResolvedValue(paginated);

      const result = await service.getAll("proj-1", { page: 1, pageSize: 50 });

      expect(result).toBe(paginated);
      expect(mockRepo.getAll).toHaveBeenCalledWith(
        "proj-1",
        { page: 1, pageSize: 50 },
        undefined,
      );
    });
  });

  describe("getById — delegates to the repository", () => {
    it("returns the run when found", async () => {
      const run = makeRun(TestRunStatus.Active);

      vi.mocked(mockRepo.getById).mockResolvedValue(run);

      const result = await service.getById("proj-1", "run-1");

      expect(result).toBe(run);
    });
  });

  describe("getSummary — delegates to the repository", () => {
    it("returns the summary when found", async () => {
      const summary = {
        total: 10,
        passed: 8,
        failed: 1,
        blocked: 0,
        skipped: 1,
        passRate: 80,
      };

      vi.mocked(mockRepo.getSummary).mockResolvedValue(summary);

      const result = await service.getSummary("proj-1", "run-1");

      expect(result).toBe(summary);
    });
  });

  describe("delete — delegates to the repository", () => {
    it("resolves when the run is deleted", async () => {
      vi.mocked(mockRepo.delete).mockResolvedValue(true);

      await expect(service.delete("proj-1", "run-1")).resolves.toBeUndefined();
    });
  });
});
