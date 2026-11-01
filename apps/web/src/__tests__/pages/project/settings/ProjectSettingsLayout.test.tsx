import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  getRouteApi: () => ({ useParams: () => ({ projectId: "proj-1" }) }),
  Link: ({ children, to }: { children?: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  Outlet: () => null,
}));

vi.mock("@/features/projects/hooks", () => ({
  useProject: vi.fn(),
}));

import { useProject } from "@/features/projects/hooks";
import { ProjectSettingsLayout } from "@/pages/project/settings/ProjectSettingsLayout";

beforeEach(() => {
  vi.clearAllMocks();
});

const asRole = (role: string | undefined) =>
  vi.mocked(useProject).mockReturnValue({
    data: role ? { role, is_owner: role === "owner" } : undefined,
  } as unknown as ReturnType<typeof useProject>);

describe("ProjectSettingsLayout", () => {
  it("shows settings tabs without a duplicate project link", () => {
    asRole("admin");

    render(<ProjectSettingsLayout />);

    expect(screen.queryByRole("link", { name: "Back to project" })).toBeNull();
    expect(
      screen.getByRole("navigation", { name: "Project settings" }),
    ).toBeInTheDocument();
  });

  describe.each(["admin", "owner"])("given the current user is %s", (role) => {
    it("renders every settings tab", () => {
      asRole(role);

      render(<ProjectSettingsLayout />);

      for (const name of [/api tokens/i, /notifications/i, /members/i]) {
        expect(screen.getByRole("link", { name })).toBeInTheDocument();
      }
    });
  });

  describe.each(["viewer", "editor"])(
    "given the current user is %s",
    (role) => {
      it("shows an admins-only state instead of the tabs", () => {
        asRole(role);

        render(<ProjectSettingsLayout />);

        expect(screen.getByText("Admins only")).toBeInTheDocument();
        expect(
          screen.queryByRole("link", { name: /api tokens/i }),
        ).not.toBeInTheDocument();
      });
    },
  );

  it("waits for the project before deciding", () => {
    asRole(undefined);

    render(<ProjectSettingsLayout />);

    expect(screen.queryByText("Admins only")).not.toBeInTheDocument();
  });
});
