import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/testCaseSteps/api", () => ({
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
  },
  testCaseStepsApi: {
    create: vi.fn(),
    update: vi.fn(),
    reorder: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));

import { queryKeys } from "@/api/queryKeys";
import {
  testCaseStepQueries,
  testCaseStepsApi,
} from "@/features/testCaseSteps/api";
import {
  useCreateTestCaseStep,
  useDeleteTestCaseStep,
  useReorderTestCaseSteps,
  useTestCaseSteps,
  useUpdateTestCaseStep,
} from "@/features/testCaseSteps/hooks";
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
        expected_result: "Logged in",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testCaseStepsApi.create).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "case-1",
        { order: 1, action: "Click login", expected_result: "Logged in" },
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
        expected_result: "Logged in",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Step "Click login" added');
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
        version: 3,
        order: 1,
        action: "Click logout",
        expected_result: "Logged out",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testCaseStepsApi.update).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "case-1",
        "step-1",
        { order: 1, action: "Click logout", expected_result: "Logged out" },
        3,
      );
    });
  });
});

describe("useReorderTestCaseSteps", () => {
  describe("on mutate — calls API with the reorder input", () => {
    it("calls testCaseStepsApi.reorder with all ids and steps", async () => {
      vi.mocked(testCaseStepsApi.reorder).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useReorderTestCaseSteps("proj-1", "suite-1", "case-1"),
        { wrapper },
      );

      result.current.mutate({
        steps: [
          { id: "step-1", order: 2 },
          { id: "step-2", order: 1 },
        ],
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testCaseStepsApi.reorder).toHaveBeenCalledWith(
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
      vi.mocked(testCaseStepsApi.reorder).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveApi = () => resolve(undefined as any);
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
        () => useReorderTestCaseSteps("proj-1", "suite-1", "case-1"),
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
