import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/testRuns/api", () => ({
  testRunQueries: {
    all: vi.fn((projectId: string, search?: string) => ({
      queryKey: ["projects", projectId, "runs", search],
      queryFn: vi.fn().mockResolvedValue({ items: [] }),
    })),
    detail: vi.fn((projectId: string, id: string) => ({
      queryKey: ["projects", projectId, "runs", id],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
    summary: vi.fn((projectId: string, id: string) => ({
      queryKey: ["projects", projectId, "runs", id, "summary"],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
    logs: vi.fn((projectId: string, id: string) => ({
      queryKey: ["projects", projectId, "runs", id, "logs"],
      queryFn: vi.fn().mockResolvedValue({
        lines: ["line 3", "line 4"],
        earliestSeq: 3,
        latestSeq: 4,
        hasMore: true,
      }),
    })),
  },
  testRunsApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getLogs: vi.fn(),
  },
}));

vi.mock("@/features/testRuns/resultImport/api", () => ({
  importsApi: {
    junit: vi.fn(),
    allure: vi.fn(),
    getJob: vi.fn(),
  },
}));

vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));

import { queryKeys } from "@/api/queryKeys";
import { testRunQueries, testRunsApi } from "@/features/testRuns/api";
import {
  useCreateTestRun,
  useDeleteTestRun,
  useImportAllure,
  useImportJUnitXml,
  useRunLogs,
  useTestRun,
  useTestRuns,
  useTestRunSummary,
  useUpdateTestRun,
} from "@/features/testRuns/hooks";
import { importsApi } from "@/features/testRuns/resultImport/api";
import { notify } from "@/lib/notify";

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTestRuns", () => {
  describe("given a projectId and search — calls the query factory", () => {
    it("calls testRunQueries.all with projectId and search", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestRuns("proj-1", "smoke"), { wrapper });
      expect(testRunQueries.all).toHaveBeenCalledWith("proj-1", "smoke");
    });
  });
});

describe("useTestRun", () => {
  describe("given projectId and id — calls the detail query factory", () => {
    it("calls testRunQueries.detail with both ids", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestRun("proj-1", "run-1"), { wrapper });
      expect(testRunQueries.detail).toHaveBeenCalledWith("proj-1", "run-1");
    });
  });
});

describe("useTestRunSummary", () => {
  describe("given projectId and runId — calls the summary query factory", () => {
    it("calls testRunQueries.summary with both ids", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestRunSummary("proj-1", "run-1"), { wrapper });
      expect(testRunQueries.summary).toHaveBeenCalledWith("proj-1", "run-1");
    });
  });
});

describe("useCreateTestRun", () => {
  describe("on mutate — calls API and notifies", () => {
    it("calls testRunsApi.create with projectId and input", async () => {
      vi.mocked(testRunsApi.create).mockResolvedValue({
        id: "r1",
        name: "Smoke",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateTestRun("proj-1"), {
        wrapper,
      });

      result.current.mutate({ name: "Smoke", environment: "staging" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testRunsApi.create).toHaveBeenCalledWith("proj-1", {
        name: "Smoke",
        environment: "staging",
      });
    });

    it("notifies 'Test run created' on success", async () => {
      vi.mocked(testRunsApi.create).mockResolvedValue({
        id: "r1",
        name: "Smoke",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateTestRun("proj-1"), {
        wrapper,
      });

      result.current.mutate({ name: "Smoke", environment: "staging" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Test run "Smoke" created');
    });
  });

  describe("on mutate failure — sets error state", () => {
    it("is in error state when the API rejects", async () => {
      vi.mocked(testRunsApi.create).mockRejectedValue(
        new Error("Server error"),
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateTestRun("proj-1"), {
        wrapper,
      });

      result.current.mutate({ name: "Fail", environment: "ci" });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("on success — invalidates runs list and project detail", () => {
    it("marks testRuns.all and projects.detail as stale", async () => {
      vi.mocked(testRunsApi.create).mockResolvedValue({
        id: "r1",
        name: "Smoke",
      } as any);
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(queryKeys.testRuns.all("proj-1"), { items: [] });
      queryClient.setQueryData(queryKeys.projects.detail("proj-1"), {
        id: "proj-1",
      });

      const { result } = renderHook(() => useCreateTestRun("proj-1"), {
        wrapper,
      });
      result.current.mutate({ name: "Smoke", environment: "staging" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(
        queryClient.getQueryState(queryKeys.testRuns.all("proj-1"))
          ?.isInvalidated,
      ).toBe(true);
      expect(
        queryClient.getQueryState(queryKeys.projects.detail("proj-1"))
          ?.isInvalidated,
      ).toBe(true);
    });
  });
});

describe("useUpdateTestRun", () => {
  describe("on mutate — calls API with stripped input", () => {
    it("calls testRunsApi.update with projectId, id, and update payload", async () => {
      vi.mocked(testRunsApi.update).mockResolvedValue({
        id: "r1",
        name: "Updated",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateTestRun("proj-1"), {
        wrapper,
      });

      result.current.mutate({
        id: "r1",
        version: 3,
        name: "Updated",
        environment: "prod",
        status: "completed" as any,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testRunsApi.update).toHaveBeenCalledWith(
        "proj-1",
        "r1",
        {
          name: "Updated",
          environment: "prod",
          status: "completed",
        },
        3,
      );
    });

    it("notifies 'Test run updated' on success", async () => {
      vi.mocked(testRunsApi.update).mockResolvedValue({
        id: "r1",
        name: "Updated",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateTestRun("proj-1"), {
        wrapper,
      });

      result.current.mutate({
        id: "r1",
        version: 1,
        name: "Updated",
        environment: "prod",
        status: "completed" as any,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Test run "Updated" updated');
    });
  });
});

describe("useDeleteTestRun", () => {
  describe("on mutate — calls API and notifies", () => {
    it("calls testRunsApi.delete with projectId and runId", async () => {
      vi.mocked(testRunsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteTestRun("proj-1"), {
        wrapper,
      });

      result.current.mutate("r1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testRunsApi.delete).toHaveBeenCalledWith("proj-1", "r1");
    });

    it("notifies 'Test run deleted' on success", async () => {
      vi.mocked(testRunsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteTestRun("proj-1"), {
        wrapper,
      });

      result.current.mutate("r1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith("Test run deleted");
    });
  });

  describe("on success — removes detail and summary from cache", () => {
    it("removes the run detail entry", async () => {
      vi.mocked(testRunsApi.delete).mockResolvedValue(undefined as any);
      const { queryClient, wrapper } = makeWrapper();
      const detailKey = queryKeys.testRuns.detail("proj-1", "r1");
      queryClient.setQueryData(detailKey, { id: "r1" });

      const { result } = renderHook(() => useDeleteTestRun("proj-1"), {
        wrapper,
      });
      result.current.mutate("r1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryState(detailKey)).toBeUndefined();
    });

    it("removes the run summary entry", async () => {
      vi.mocked(testRunsApi.delete).mockResolvedValue(undefined as any);
      const { queryClient, wrapper } = makeWrapper();
      const summaryKey = queryKeys.testRuns.summary("proj-1", "r1");
      queryClient.setQueryData(summaryKey, { total: 5, passed: 5 });

      const { result } = renderHook(() => useDeleteTestRun("proj-1"), {
        wrapper,
      });
      result.current.mutate("r1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryState(summaryKey)).toBeUndefined();
    });
  });
});

describe("useImportJUnitXml", () => {
  describe("on mutate — calls importsApi.junit and notifies", () => {
    it("calls importsApi.junit with projectId and input", async () => {
      vi.mocked(importsApi.junit).mockResolvedValue({
        id: "job1",
        status: "completed",
        test_run_id: "r1",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useImportJUnitXml("proj-1"), {
        wrapper,
      });

      result.current.mutate({ xml: "<xml/>", environment: "ci" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(importsApi.junit).toHaveBeenCalledWith("proj-1", {
        xml: "<xml/>",
        environment: "ci",
      });
    });

    it("polls the job until it completes before invalidating and notifying", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(importsApi.junit).mockResolvedValue({
        id: "job1",
        status: "pending",
      } as any);
      vi.mocked(importsApi.getJob)
        .mockResolvedValueOnce({ id: "job1", status: "processing" } as any)
        .mockResolvedValueOnce({
          id: "job1",
          status: "completed",
          test_run_id: "r1",
        } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useImportJUnitXml("proj-1"), {
        wrapper,
      });

      result.current.mutate({ xml: "<xml/>", environment: "ci" });

      try {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(3000);
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
      } finally {
        vi.useRealTimers();
      }

      expect(importsApi.getJob).toHaveBeenCalledWith("proj-1", "job1");
      expect(notify).toHaveBeenCalledWith("JUnit results imported");
    });

    it("notifies the error and does not invalidate when the job fails", async () => {
      vi.mocked(importsApi.junit).mockResolvedValue({
        id: "job1",
        status: "failed",
        error: "Malformed report",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useImportJUnitXml("proj-1"), {
        wrapper,
      });

      result.current.mutate({ xml: "<xml/>", environment: "ci" });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(notify).toHaveBeenCalledWith("Malformed report", "error");
    });

    it("notifies when polling the job status fails", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(importsApi.junit).mockResolvedValue({
        id: "job1",
        status: "pending",
      } as any);
      vi.mocked(importsApi.getJob).mockRejectedValue(
        new AxiosError("Request failed with status code 503"),
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useImportJUnitXml("proj-1"), {
        wrapper,
      });

      result.current.mutate({ xml: "<xml/>", environment: "ci" });

      try {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(1500);
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
      } finally {
        vi.useRealTimers();
      }

      expect(notify).toHaveBeenCalledWith(
        "Could not check the import status. Refresh the runs list in a moment.",
        "error",
      );
    });

    it("leaves a rejected upload to the global API error toast", async () => {
      vi.mocked(importsApi.junit).mockRejectedValue(
        new AxiosError("Request failed with status code 422"),
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useImportJUnitXml("proj-1"), {
        wrapper,
      });

      result.current.mutate({ xml: "<xml/>", environment: "ci" });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(notify).not.toHaveBeenCalled();
    });
  });
});

describe("useImportAllure", () => {
  describe("on mutate — calls importsApi.allure and notifies", () => {
    it("calls importsApi.allure with projectId and input", async () => {
      vi.mocked(importsApi.allure).mockResolvedValue({
        id: "job2",
        status: "completed",
        test_run_id: "r1",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useImportAllure("proj-1"), {
        wrapper,
      });

      result.current.mutate({ results: [], environment: "ci" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(importsApi.allure).toHaveBeenCalledWith("proj-1", {
        results: [],
        environment: "ci",
      });
    });

    it("notifies 'Test run imported' on success", async () => {
      vi.mocked(importsApi.allure).mockResolvedValue({
        id: "job2",
        status: "completed",
        test_run_id: "r1",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useImportAllure("proj-1"), {
        wrapper,
      });

      result.current.mutate({ results: [], environment: "ci" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith("Allure results imported");
    });
  });
});

describe("useRunLogs", () => {
  it("exposes the newest page of log lines", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRunLogs("proj-1", "r1"), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.lines).toEqual(["line 3", "line 4"]),
    );
    expect(result.current.hasMore).toBe(true);
  });

  it("prepends earlier lines when loading earlier", async () => {
    vi.mocked(testRunsApi.getLogs).mockResolvedValue({
      lines: ["line 1", "line 2"],
      earliestSeq: 1,
      latestSeq: 2,
      hasMore: false,
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRunLogs("proj-1", "r1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.earliestSeq).toBe(3));

    act(() => result.current.loadEarlier());

    await waitFor(() =>
      expect(result.current.lines).toEqual([
        "line 1",
        "line 2",
        "line 3",
        "line 4",
      ]),
    );
    expect(testRunsApi.getLogs).toHaveBeenCalledWith("proj-1", "r1", 3);
    expect(result.current.earliestSeq).toBe(1);
    expect(result.current.hasMore).toBe(false);
  });

  it("notifies when loading earlier lines fails", async () => {
    vi.mocked(testRunsApi.getLogs).mockRejectedValue(new Error("boom"));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRunLogs("proj-1", "r1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.earliestSeq).toBe(3));

    act(() => result.current.loadEarlier());

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        "Could not load earlier log lines",
        "error",
      ),
    );
    expect(result.current.lines).toEqual(["line 3", "line 4"]);
  });
});
