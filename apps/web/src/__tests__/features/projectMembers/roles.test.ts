import { describe, expect, it } from "vitest";

import {
  assignableRoles,
  canManageMember,
} from "@/features/projectMembers/roles";

describe("canManageMember", () => {
  it("lets the owner manage everyone", () => {
    expect(canManageMember("owner", "admin")).toBe(true);
  });

  it("lets admins manage viewers and editors but not other admins", () => {
    expect(canManageMember("admin", "viewer")).toBe(true);
    expect(canManageMember("admin", "editor")).toBe(true);
    expect(canManageMember("admin", "admin")).toBe(false);
  });

  it("lets editors and viewers manage no one", () => {
    expect(canManageMember("editor", "viewer")).toBe(false);
    expect(canManageMember("viewer", "viewer")).toBe(false);
  });
});

describe("assignableRoles", () => {
  it("gives the owner every role and admins all but admin", () => {
    expect(assignableRoles("owner")).toEqual(["viewer", "editor", "admin"]);
    expect(assignableRoles("admin")).toEqual(["viewer", "editor"]);
    expect(assignableRoles("editor")).toEqual([]);
  });
});
