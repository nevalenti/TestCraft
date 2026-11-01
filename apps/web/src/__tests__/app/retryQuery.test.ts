import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { retryQuery } from "@/app/retryQuery";

const responseError = (status: number) =>
  new AxiosError("failed", undefined, undefined, undefined, {
    status,
    statusText: "",
    data: undefined,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe("retryQuery", () => {
  it("does not retry client errors", () => {
    expect(retryQuery(0, responseError(404))).toBe(false);
    expect(retryQuery(0, responseError(403))).toBe(false);
  });

  it("retries server errors and failed connections once", () => {
    expect(retryQuery(0, responseError(503))).toBe(true);
    expect(retryQuery(0, new AxiosError("Network Error"))).toBe(true);
    expect(retryQuery(1, responseError(503))).toBe(false);
  });
});
