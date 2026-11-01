import { QueryClient } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";

import { refetchOnConflict } from "@/app/refetchOnConflict";

const responseError = (status: number) =>
  new AxiosError("failed", undefined, undefined, undefined, {
    status,
    statusText: "",
    data: undefined,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe("refetchOnConflict", () => {
  it("refetches everything when a save was based on a stale version", async () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await refetchOnConflict(queryClient, responseError(412));

    expect(invalidate).toHaveBeenCalledWith();
  });

  it("leaves the cache alone for other failures", async () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await refetchOnConflict(queryClient, responseError(422));
    await refetchOnConflict(queryClient, new Error("offline"));

    expect(invalidate).not.toHaveBeenCalled();
  });
});
