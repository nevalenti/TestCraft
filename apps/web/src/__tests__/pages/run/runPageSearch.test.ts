import { describe, expect, it } from "vitest";

import { validateRunPageSearch } from "@/pages/run/runPageSearch";

describe("validateRunPageSearch", () => {
  it("keeps known values", () => {
    expect(
      validateRunPageSearch({ status: "failed", q: "login", group: "suite" }),
    ).toEqual({ status: "failed", q: "login", group: "suite" });
  });

  it("drops unknown or empty values", () => {
    expect(
      validateRunPageSearch({ status: "exploded", q: "", group: "label" }),
    ).toEqual({ status: undefined, q: undefined, group: undefined });
  });
});
