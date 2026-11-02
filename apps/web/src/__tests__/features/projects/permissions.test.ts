import { describe, expect, it } from "vitest";

import { hasRole } from "@/features/projects/permissions";

describe("hasRole", () => {
  it("ranks viewer < editor < admin < owner", () => {
    expect(hasRole("viewer", "editor")).toBe(false);
    expect(hasRole("editor", "editor")).toBe(true);
    expect(hasRole("admin", "editor")).toBe(true);
    expect(hasRole("owner", "admin")).toBe(true);
    expect(hasRole("editor", "admin")).toBe(false);
  });

  it("allows nothing before the role is known", () => {
    expect(hasRole(undefined, "viewer")).toBe(false);
  });
});
