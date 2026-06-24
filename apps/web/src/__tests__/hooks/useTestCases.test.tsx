import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/testCases", () => ({
  testCaseQueries: {
    byProject: vi.fn((projectId: string) => ({
      queryKey: ["projects", projectId, "cases"],
      queryFn: vi.fn().mockResolvedValue({ items: [] }),
    })),
    all: vi.fn((projectId: string, suiteId: string, search?: string) => ({
      queryKey: ["projects", projectId, "suites", suiteId, "cases", search],
      queryFn: vi.fn().mockResolvedValue({ items: [] }),
    })),
    detail: vi.fn((projectId: string, suiteId: string, id: string) => ({
      queryKey: ["projects", projectId, "suites", suiteId, "cases", id],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
  },
  testCasesApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));

import { testCaseQueries, testCasesApi } from "@/api/testCases";
import {
  useCreateTestCase,
  useDeleteTestCase,
  useProjectTestCases,
  useTestCase,
  useTestCases,
  useUpdateTestCase,
} from "@/hooks/useTestCases";
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

describe("useProjectTestCases", () => {
  describe("given a projectId — calls the byProject query factory", () => {
    it("calls testCaseQueries.byProject with the projectId", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useProjectTestCases("proj-1"), { wrapper });
      expect(testCaseQueries.byProject).toHaveBeenCalledWith("proj-1");
    });
  });
});

describe("useTestCases", () => {
  describe("given projectId, suiteId, and search — calls the query factory", () => {
    it("calls testCaseQueries.all with all three args", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestCases("proj-1", "suite-1", "login"), { wrapper });
      expect(testCaseQueries.all).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "login",
      );
    });
  });
});

describe("useTestCase", () => {
  describe("given projectId, suiteId, and id — calls the detail query factory", () => {
    it("calls testCaseQueries.detail with all three ids", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestCase("proj-1", "suite-1", "case-1"), { wrapper });
      expect(testCaseQueries.detail).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "case-1",
      );
    });
  });
});

describe("useCreateTestCase", () => {
  describe("on mutate — calls API and notifies", () => {
    it("calls testCasesApi.create with projectId, suiteId, and input", async () => {
      vi.mocked(testCasesApi.create).mockResolvedValue({
        id: "c1",
        name: "Login test",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useCreateTestCase("proj-1", "suite-1"),
        { wrapper },
      );

      result.current.mutate({ name: "Login test" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testCasesApi.create).toHaveBeenCalledWith("proj-1", "suite-1", {
        name: "Login test",
      });
    });

    it("notifies 'Test case created' on success", async () => {
      vi.mocked(testCasesApi.create).mockResolvedValue({
        id: "c1",
        name: "Login test",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useCreateTestCase("proj-1", "suite-1"),
        { wrapper },
      );

      result.current.mutate({ name: "Login test" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith("Test case created");
    });
  });
});

describe("useUpdateTestCase", () => {
  describe("on mutate — calls API with id and stripped input", () => {
    it("calls testCasesApi.update with all ids and the update payload", async () => {
      vi.mocked(testCasesApi.update).mockResolvedValue({
        id: "c1",
        name: "Updated",
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useUpdateTestCase("proj-1", "suite-1"),
        { wrapper },
      );

      result.current.mutate({ id: "c1", name: "Updated", priority: "Medium" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testCasesApi.update).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "c1",
        { name: "Updated", priority: "Medium" },
      );
    });
  });
});

describe("useDeleteTestCase", () => {
  describe("on mutate — calls API and notifies", () => {
    it("calls testCasesApi.delete with projectId, suiteId, and caseId", async () => {
      vi.mocked(testCasesApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useDeleteTestCase("proj-1", "suite-1"),
        { wrapper },
      );

      result.current.mutate("c1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testCasesApi.delete).toHaveBeenCalledWith(
        "proj-1",
        "suite-1",
        "c1",
      );
    });

    it("notifies 'Test case deleted' on success", async () => {
      vi.mocked(testCasesApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useDeleteTestCase("proj-1", "suite-1"),
        { wrapper },
      );

      result.current.mutate("c1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith("Test case deleted");
    });
  });
});
