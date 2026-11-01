import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { notifyMutationError } from "@/app/notifyMutationError";
import { useNotificationsStore } from "@/stores/notifications";

const add = vi.fn();

vi.mock("@/stores/notifications", () => ({
  useNotificationsStore: { getState: () => ({ add }) },
}));

const responseError = (
  data: unknown,
  headers: Record<string, string> = {},
  message = "Request failed",
) =>
  new AxiosError(message, undefined, undefined, undefined, {
    status: 422,
    statusText: "",
    data,
    headers,
    config: { headers: new AxiosHeaders() },
  });

describe("notifyMutationError", () => {
  beforeEach(() => add.mockClear());

  it("shows the problem's detail with the request id", () => {
    notifyMutationError(
      responseError({ detail: "Name is required" }, { "x-request-id": "r-1" }),
    );

    expect(useNotificationsStore.getState().add).toHaveBeenCalledWith({
      type: "error",
      message: "Name is required (ref: r-1)",
      timeout: 10_000,
    });
  });

  it("falls back to the problem's title, then the error message", () => {
    notifyMutationError(responseError({ title: "Forbidden" }));
    notifyMutationError(responseError(undefined, {}, "Network Error"));

    expect(add).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ message: "Forbidden" }),
    );
    expect(add).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ message: "Network Error" }),
    );
  });

  it("stays quiet for silent mutations and errors that are not API failures", () => {
    notifyMutationError(responseError({ detail: "Run not found" }), true);
    notifyMutationError(new Error("Session expired — redirecting to login"));

    expect(add).not.toHaveBeenCalled();
  });
});
