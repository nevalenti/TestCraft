import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/testCaseSteps", () => ({
  testCaseStepQueries: {
    all: vi.fn((projectId: string, suiteId: string, caseId: string) => ({
      queryKey: [
        "projects",
        projectId,
        "suites",
        suiteId,
        "cases",
        caseId,
        "steps",
      ],
      queryFn: vi.fn().mockResolvedValue({ items: [] }),
    })),
    detail: vi.fn(
      (projectId: string, suiteId: string, caseId: string, id: string) => ({
        queryKey: [
          "projects",
          projectId,
          "suites",
          suiteId,
          "cases",
          caseId,
          "steps",
          id,
        ],
        queryFn: vi.fn().mockResolvedValue(null),
      }),
    ),
  },
  testCaseStepsApi: {
    create: vi.fn(),
    update: vi.fn(),
    bulkReorder: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));

import { queryKeys } from "@/api/queryKeys";
import { testCaseStepQueries, testCaseStepsApi } from "@/api/testCaseSteps";
import {
  useBulkReorderSteps,
  useCreateTestCaseStep,
  useDeleteTestCaseStep,
  useTestCaseStep,
  useTestCaseSteps,
  useUpdateTestCaseStep,
} from "@/hooks/useTestCaseSteps";
import { notify } from "@/lib/notify";

const makeWrapper = (queryClient?: QueryClient) => {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { queryClient: client, wrapper };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTestCaseSteps", () => {
  describe("given projectId, suiteId, caseId — calls the query factory", () => {
    it("calls testCaseStepQueries.all with all three ids", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestCaseSteps("proj-1", "suite-1", "case-1"), {
        wrapper,
      });
      expect(testCaseStepQueries.all).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "case-1",
      );
    });
  });
});

describe("useTestCaseStep", () => {
  describe("given all four ids — calls the detail query factory", () => {
    it("calls testCaseStepQueries.detail with all ids", () => {
      const { wrapper } = makeWrapper();
      renderHook(
        () => useTestCaseStep("proj-1", "suite-1", "case-1", "step-1"),
        { wrapper },
      );
      expect(testCaseStepQueries.detail).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "case-1",
        "step-1",
      );
    });
  });
});

describe("useCreateTestCaseStep", () => {
  describe("on mutate — calls API and notifies", () => {
    it("calls testCaseStepsApi.create with all ids and input", async () => {
      vi.mocked(testCaseStepsApi.create).mockResolvedValue({
        id: "step-1",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useCreateTestCaseStep("proj-1", "suite-1", "case-1"),
        { wrapper },
      );

      result.current.mutate({
        order: 1,
        action: "Click login",
        expectedResult: "Logged in",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testCaseStepsApi.create).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "case-1",
        { order: 1, action: "Click login", expectedResult: "Logged in" },
      );
    });

    it("notifies 'Step added' on success", async () => {
      vi.mocked(testCaseStepsApi.create).mockResolvedValue({
        id: "step-1",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useCreateTestCaseStep("proj-1", "suite-1", "case-1"),
        { wrapper },
      );

      result.current.mutate({
        order: 1,
        action: "Click login",
        expectedResult: "Logged in",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith("Step added");
    });
  });
});

describe("useUpdateTestCaseStep", () => {
  describe("on mutate — calls API with stripped input", () => {
    it("calls testCaseStepsApi.update with all ids and update payload", async () => {
      vi.mocked(testCaseStepsApi.update).mockResolvedValue({
        id: "step-1",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useUpdateTestCaseStep("proj-1", "suite-1", "case-1"),
        { wrapper },
      );

      result.current.mutate({
        id: "step-1",
        order: 1,
        action: "Click logout",
        expectedResult: "Logged out",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testCaseStepsApi.update).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "case-1",
        "step-1",
        { order: 1, action: "Click logout", expectedResult: "Logged out" },
      );
    });
  });
});

describe("useBulkReorderSteps", () => {
  describe("on mutate — calls API with the reorder input", () => {
    it("calls testCaseStepsApi.bulkReorder with all ids and steps", async () => {
      vi.mocked(testCaseStepsApi.bulkReorder).mockResolvedValue(
        undefined as any,
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useBulkReorderSteps("proj-1", "suite-1", "case-1"),
        { wrapper },
      );

      result.current.mutate({
        steps: [
          { id: "step-1", order: 2 },
          { id: "step-2", order: 1 },
        ],
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testCaseStepsApi.bulkReorder).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "case-1",
        {
          steps: [
            { id: "step-1", order: 2 },
            { id: "step-2", order: 1 },
          ],
        },
      );
    });

    it("optimistically updates step order in the cache before API resolves", async () => {
      let resolveApi!: () => void;
      vi.mocked(testCaseStepsApi.bulkReorder).mockImplementation(
        () =>
          new Promise((res) => {
            resolveApi = () => res(undefined as any);
          }),
      );

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const queryKey = queryKeys.testCaseSteps.all(
        "proj-1",
        "suite-1",
        "case-1",
      );
      queryClient.setQueryData(queryKey, {
        items: [
          { id: "step-1", order: 1, action: "A", expected: "E" },
          { id: "step-2", order: 2, action: "B", expected: "F" },
        ],
      });

      const { wrapper } = makeWrapper(queryClient);
      const { result } = renderHook(
        () => useBulkReorderSteps("proj-1", "suite-1", "case-1"),
        { wrapper },
      );

      result.current.mutate({
        steps: [
          { id: "step-1", order: 2 },
          { id: "step-2", order: 1 },
        ],
      });

      await waitFor(() => {
        const data = queryClient.getQueryData<any>(queryKey);
        return data?.items.find((s: any) => s.id === "step-1")?.order === 2;
      });

      const data = queryClient.getQueryData<any>(queryKey);
      expect(data?.items.find((s: any) => s.id === "step-1").order).toBe(2);
      expect(data?.items.find((s: any) => s.id === "step-2").order).toBe(1);

      resolveApi();
    });
  });
});

describe("useDeleteTestCaseStep", () => {
  describe("on mutate — calls API and notifies", () => {
    it("calls testCaseStepsApi.delete with all ids", async () => {
      vi.mocked(testCaseStepsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useDeleteTestCaseStep("proj-1", "suite-1", "case-1"),
        { wrapper },
      );

      result.current.mutate("step-1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testCaseStepsApi.delete).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "case-1",
        "step-1",
      );
    });

    it("notifies 'Step deleted' on success", async () => {
      vi.mocked(testCaseStepsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useDeleteTestCaseStep("proj-1", "suite-1", "case-1"),
        { wrapper },
      );

      result.current.mutate("step-1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith("Step deleted");
    });
  });
});
