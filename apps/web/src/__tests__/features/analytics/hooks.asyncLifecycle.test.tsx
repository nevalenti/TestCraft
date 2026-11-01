import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  getRunTrend: vi.fn(),
  getFlakyTests: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { useFlakyTests, useRunTrend } from "@/features/analytics/hooks";

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRunTrend", () => {
  describe("given a request that resolves — transitions through the real lifecycle", () => {
    it("goes from isPending to isSuccess with the resolved data", async () => {
      const trendData = [{ runId: "run-1", pass_rate: 0.9 }];
      vi.mocked(sdk.getRunTrend).mockResolvedValue({
        data: trendData,
      } as never);

      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useRunTrend("proj-1", 20), {
        wrapper,
      });

      expect(result.current.isPending).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(trendData);
      expect(sdk.getRunTrend).toHaveBeenCalledWith({
        path: { project_id: "proj-1" },
        query: { limit: 20 },
      });
    });
  });

  describe("given a request that rejects — transitions through the real lifecycle", () => {
    it("goes from isPending to isError with the underlying error", async () => {
      const requestError = new Error("Network error");
      vi.mocked(sdk.getRunTrend).mockRejectedValue(requestError);

      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useRunTrend("proj-1", 20), {
        wrapper,
      });

      expect(result.current.isPending).toBe(true);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(requestError);
      expect(result.current.data).toBeUndefined();
    });
  });
});

describe("useFlakyTests", () => {
  describe("given a request that resolves — transitions through the real lifecycle", () => {
    it("goes from isPending to isSuccess with the resolved data", async () => {
      const flakyData = [{ test_case_id: "case-1", flakeRate: 0.4 }];
      vi.mocked(sdk.getFlakyTests).mockResolvedValue({
        data: flakyData,
      } as never);

      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useFlakyTests("proj-1", 3), {
        wrapper,
      });

      expect(result.current.isPending).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(flakyData);
    });
  });

  describe("given a request that rejects — transitions through the real lifecycle", () => {
    it("goes from isPending to isError", async () => {
      vi.mocked(sdk.getFlakyTests).mockRejectedValue(new Error("Server error"));

      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useFlakyTests("proj-1", 3), {
        wrapper,
      });

      expect(result.current.isPending).toBe(true);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.data).toBeUndefined();
    });
  });
});
