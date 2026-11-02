import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/testResults/api", () => {
  const testResultsApi = { getAll: vi.fn() };
  return {
    testResultsApi,
    testResultQueries: {
      feed: vi.fn((projectId: string, runId: string) => ({
        queryKey: ["projects", projectId, "runs", runId, "results", "feed"],
        queryFn: () =>
          testResultsApi.getAll(projectId, runId, undefined, undefined, 1, 500),
      })),
    },
  };
});

import { testResultsApi } from "@/features/testResults/api";
import { useResultFeed } from "@/features/testRuns/useResultFeed";

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return wrapper;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useResultFeed", () => {
  it("requests the full page of results for the run", async () => {
    vi.mocked(testResultsApi.getAll).mockResolvedValue({
      items: [],
      total: 0,
    } as any);
    const wrapper = makeWrapper();

    renderHook(() => useResultFeed("p1", "r1"), { wrapper });

    await waitFor(() =>
      expect(testResultsApi.getAll).toHaveBeenCalledWith(
        "p1",
        "r1",
        undefined,
        undefined,
        1,
        500,
      ),
    );
  });

  it("reverses the page items so the newest result is first", async () => {
    vi.mocked(testResultsApi.getAll).mockResolvedValue({
      items: [{ id: "1" }, { id: "2" }, { id: "3" }],
      total: 3,
    } as any);
    const wrapper = makeWrapper();

    const { result } = renderHook(() => useResultFeed("p1", "r1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items.map((i: any) => i.id)).toEqual(["3", "2", "1"]);
  });

  it("defaults items to an empty array before they resolve", () => {
    vi.mocked(testResultsApi.getAll).mockReturnValue(new Promise(() => {}));
    const wrapper = makeWrapper();

    const { result } = renderHook(() => useResultFeed("p1", "r1"), {
      wrapper,
    });

    expect(result.current.items).toEqual([]);
  });
});
