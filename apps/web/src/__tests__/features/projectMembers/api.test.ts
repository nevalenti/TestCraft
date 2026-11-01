import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listProjectMembers: vi.fn(),
  addProjectMember: vi.fn(),
  removeProjectMember: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { projectMembersApi } from "@/features/projectMembers/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("projectMembersApi", () => {
  it("getAll fetches members for the project", async () => {
    vi.mocked(sdk.listProjectMembers).mockResolvedValue({
      data: [],
    } as never);

    await projectMembersApi.getAll("p1");

    expect(sdk.listProjectMembers).toHaveBeenCalledWith({
      path: { project_id: "p1" },
    });
  });

  it("add posts the new member payload", async () => {
    vi.mocked(sdk.addProjectMember).mockResolvedValue({
      data: { id: "m1" },
    } as never);

    await projectMembersApi.add("p1", { userId: "u1", role: "Editor" } as any);

    expect(sdk.addProjectMember).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      body: {
        userId: "u1",
        role: "Editor",
      },
    });
  });

  it("remove deletes the member by id", () => {
    projectMembersApi.remove("p1", "m1");

    expect(sdk.removeProjectMember).toHaveBeenCalledWith({
      path: { project_id: "p1", member_id: "m1" },
    });
  });
});
