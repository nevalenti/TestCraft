import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/testResults", () => ({
  testResultQueries: {
    all: vi.fn(
      (
        projectId: string,
        runId: string,
        status?: string,
        search?: string,
        page = 1,
      ) => ({
        queryKey: [
          "projects",
          projectId,
          "runs",
          runId,
          "results",
          status,
          search,
          page,
        ],
        queryFn: vi.fn().mockResolvedValue({ items: [] }),
      }),
    ),
    detail: vi.fn((projectId: string, runId: string, id: string) => ({
      queryKey: ["projects", projectId, "runs", runId, "results", id],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
  },
  testResultsApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));

import { testResultQueries, testResultsApi } from "@/api/testResults";
import {
  useCreateTestResult,
  useDeleteTestResult,
  useTestResult,
  useTestResults,
  useUpdateTestResult,
} from "@/hooks/useTestResults";
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

describe("useTestResults", () => {
  describe("given projectId, runId, and filters — calls the query factory", () => {
    it("calls testResultQueries.all with projectId, runId, status, search, and page", () => {
      const { wrapper } = makeWrapper();
      renderHook(
        () => useTestResults("proj-1", "run-1", "Failed" as any, "login", 2),
        { wrapper },
      );
      expect(testResultQueries.all).toHaveBeenCalledWith(
        "proj-1",
        "run-1",
        "Failed",
        "login",
        2,
      );
    });

    it("calls testResultQueries.all with defaults when no filters given", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestResults("proj-1", "run-1"), { wrapper });
      expect(testResultQueries.all).toHaveBeenCalledWith(
        "proj-1",
        "run-1",
        undefined,
        undefined,
        1,
      );
    });
  });
});

describe("useTestResult", () => {
  describe("given projectId, runId, and id — calls the detail query factory", () => {
    it("calls testResultQueries.detail with all three ids", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestResult("proj-1", "run-1", "result-1"), {
        wrapper,
      });
      expect(testResultQueries.detail).toHaveBeenCalledWith(
        "proj-1",
        "run-1",
        "result-1",
      );
    });
  });
});

describe("useCreateTestResult", () => {
  describe("on mutate — calls API and notifies", () => {
    it("calls testResultsApi.create with projectId, runId, and input", async () => {
      vi.mocked(testResultsApi.create).mockResolvedValue({
        id: "res-1",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useCreateTestResult("proj-1", "run-1"),
        { wrapper },
      );

      const input = {
        testCaseId: "case-1",
        status: "Passed" as any,
        executedAt: new Date().toISOString(),
      };
      result.current.mutate(input);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testResultsApi.create).toHaveBeenCalledWith(
        "proj-1",
        "run-1",
        input,
      );
    });

    it("notifies 'Result saved' on success", async () => {
      vi.mocked(testResultsApi.create).mockResolvedValue({
        id: "res-1",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useCreateTestResult("proj-1", "run-1"),
        { wrapper },
      );

      result.current.mutate({
        testCaseId: "case-1",
        status: "Passed" as any,
        executedAt: new Date().toISOString(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith("Result saved");
    });
  });
});

describe("useUpdateTestResult", () => {
  describe("on mutate — calls API with stripped input", () => {
    it("calls testResultsApi.update with projectId, runId, id, and update payload", async () => {
      vi.mocked(testResultsApi.update).mockResolvedValue({
        id: "res-1",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useUpdateTestResult("proj-1", "run-1"),
        { wrapper },
      );

      result.current.mutate({
        id: "res-1",
        status: "Failed" as any,
        notes: "Regression found",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testResultsApi.update).toHaveBeenCalledWith(
        "proj-1",
        "run-1",
        "res-1",
        { status: "Failed", notes: "Regression found" },
      );
    });

    it("notifies 'Result updated' on success", async () => {
      vi.mocked(testResultsApi.update).mockResolvedValue({
        id: "res-1",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useUpdateTestResult("proj-1", "run-1"),
        { wrapper },
      );

      result.current.mutate({ id: "res-1", status: "Blocked" as any });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith("Result updated");
    });
  });
});

describe("useDeleteTestResult", () => {
  describe("on mutate — calls API and notifies", () => {
    it("calls testResultsApi.delete with projectId, runId, and resultId", async () => {
      vi.mocked(testResultsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useDeleteTestResult("proj-1", "run-1"),
        { wrapper },
      );

      result.current.mutate("res-1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testResultsApi.delete).toHaveBeenCalledWith(
        "proj-1",
        "run-1",
        "res-1",
      );
    });

    it("notifies 'Result deleted' on success", async () => {
      vi.mocked(testResultsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useDeleteTestResult("proj-1", "run-1"),
        { wrapper },
      );

      result.current.mutate("res-1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith("Result deleted");
    });
  });
});
