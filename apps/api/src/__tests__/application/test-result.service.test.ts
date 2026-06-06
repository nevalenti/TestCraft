import { TestResultStatus, TestRunStatus } from "@testcraft/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ITestResultRepository } from "@/application/test-results/test-result.repository";
import { CreateTestResult } from "@/application/test-results/test-result.repository";
import { TestResultService } from "@/application/test-results/test-result.service";
import { ITestRunRepository } from "@/application/test-runs/test-run.repository";
import { DomainError, NotFoundError } from "@/domain/errors";
import { TestResult } from "@/domain/test-result";
import { TestRun } from "@/domain/test-run";
import { CacheService } from "@/infrastructure/cache/cache.service";

const makeRun = (status: TestRunStatus): TestRun => ({
  id: "run-1",
  projectId: "proj-1",
  name: "Regression",
  environment: "staging",
  status,
  executedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeResult = (): TestResult => ({
  id: "result-1",
  testRunId: "run-1",
  testCaseId: "case-1",
  suiteId: "suite-1",
  testCaseName: "Login test",
  status: TestResultStatus.Passed,
  notes: null,
  executedAt: new Date(),
  executedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createDto: CreateTestResult = {
  testCaseId: "case-1",
  status: TestResultStatus.Passed,
  executedAt: new Date(),
};

const mockResultRepo: ITestResultRepository = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockRunRepo: ITestRunRepository = {
  findById: vi.fn(),
  getAll: vi.fn(),
  getById: vi.fn(),
  getSummary: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe("TestResultService #unit", { tags: ["unit"] }, () => {
  let service: TestResultService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TestResultService(
      mockResultRepo,
      mockRunRepo,
      new CacheService(null),
    );
  });

  describe("create — run status validation", () => {
    describe("given an Active run", () => {
      it("creates the result and returns it", async () => {
        const result = makeResult();
        vi.mocked(mockRunRepo.findById).mockResolvedValue(
          makeRun(TestRunStatus.Active),
        );
        vi.mocked(mockResultRepo.create).mockResolvedValue(result);

        const created = await service.create("run-1", createDto, "user-1");

        expect(created).toBe(result);
        expect(mockResultRepo.create).toHaveBeenCalledOnce();
      });
    });

    describe("given a Completed run", () => {
      it("creates the result", async () => {
        vi.mocked(mockRunRepo.findById).mockResolvedValue(
          makeRun(TestRunStatus.Completed),
        );
        vi.mocked(mockResultRepo.create).mockResolvedValue(makeResult());

        await service.create("run-1", createDto);

        expect(mockResultRepo.create).toHaveBeenCalledOnce();
      });
    });

    describe("given an Archived run", () => {
      it("throws a DomainError without creating a result", async () => {
        vi.mocked(mockRunRepo.findById).mockResolvedValue(
          makeRun(TestRunStatus.Archived),
        );

        await expect(service.create("run-1", createDto)).rejects.toThrow(
          DomainError,
        );

        expect(mockResultRepo.create).not.toHaveBeenCalled();
      });
    });

    describe("given a non-existent run", () => {
      it("throws NotFoundError", async () => {
        vi.mocked(mockRunRepo.findById).mockResolvedValue(null);

        await expect(service.create("missing", createDto)).rejects.toThrow(
          NotFoundError,
        );
      });
    });

    describe("given a userId", () => {
      it("forwards the userId to the repository", async () => {
        vi.mocked(mockRunRepo.findById).mockResolvedValue(
          makeRun(TestRunStatus.Active),
        );
        vi.mocked(mockResultRepo.create).mockResolvedValue(makeResult());

        await service.create("run-1", createDto, "user-abc");

        expect(mockResultRepo.create).toHaveBeenCalledWith(
          "run-1",
          createDto,
          "user-abc",
        );
      });
    });
  });

  describe("getAll — delegates to the repository", () => {
    it("passes runId, status, and pagination through unchanged", async () => {
      const paginated = { items: [], total: 0, page: 1, pageSize: 50 };
      vi.mocked(mockResultRepo.getAll).mockResolvedValue(paginated);

      const result = await service.getAll("run-1", TestResultStatus.Failed, {
        page: 1,
        pageSize: 50,
      });

      expect(result).toBe(paginated);
      expect(mockResultRepo.getAll).toHaveBeenCalledWith(
        "run-1",
        TestResultStatus.Failed,
        { page: 1, pageSize: 50 },
        undefined,
      );
    });
  });

  describe("getById — delegates to the repository", () => {
    it("returns the result when found", async () => {
      const result = makeResult();
      vi.mocked(mockResultRepo.getById).mockResolvedValue(result);

      const found = await service.getById("run-1", "result-1");

      expect(found).toBe(result);
    });
  });

  describe("delete — delegates to the repository", () => {
    it("resolves when deleted", async () => {
      vi.mocked(mockResultRepo.delete).mockResolvedValue(true);

      await expect(
        service.delete("run-1", "result-1"),
      ).resolves.toBeUndefined();
    });
  });
});
