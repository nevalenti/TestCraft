import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

vi.mock("@/features/projects/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/projects/permissions")>()),
  useProjectPermissions: vi.fn().mockReturnValue({
    role: "owner",
    canEdit: true,
    canManage: true,
    isOwner: true,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  getRouteApi: () => ({ useParams: () => ({ projectId: "proj-1" }) }),
  Link: ({
    children,
    to,
    "aria-label": ariaLabel,
  }: {
    children?: React.ReactNode;
    to: string;
    "aria-label"?: string;
  }) => (
    <a href={to} aria-label={ariaLabel}>
      {children}
    </a>
  ),
  Outlet: () => null,
  useLocation: () => "/projects/proj-1/runs",
}));

vi.mock("@/features/projects/hooks", () => ({
  useProject: vi.fn(),
}));

vi.mock("@/hooks/useBreadcrumbs", () => ({ useBreadcrumbs: vi.fn() }));

vi.mock("@/pages/project/SuitesTab", () => ({
  SuitesTab: vi.fn(() => <div data-testid="suites-section" />),
}));

vi.mock("@/pages/project/RunsTab", () => ({
  RunsTab: vi.fn(() => <div data-testid="runs-section" />),
}));

import { useProject } from "@/features/projects/hooks";
import { ProjectLayout } from "@/pages/project/ProjectLayout";

const makeProject = () => ({
  id: "proj-1",
  name: "Alpha",
  description: "An alpha project",
  suite_count: 3,
  run_count: 2,
  created_at: "2026-01-15",
  updated_at: "2026-01-15",
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProjectLayout", () => {
  describe("loading state — renders page shell immediately", () => {
    it("renders the tab links while project is loading", () => {
      vi.mocked(useProject).mockReturnValue({
        data: undefined,
        isPending: true,
        isError: false,
      } as unknown as ReturnType<typeof useProject>);
      render(<ProjectLayout />);

      expect(
        screen.getByRole("link", { name: /test runs/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /test suites/i }),
      ).toBeInTheDocument();
    });
  });

  describe("not found state — shows error message", () => {
    it("renders project not found", () => {
      vi.mocked(useProject).mockReturnValue({
        data: undefined,
        isPending: false,
        isError: false,
      } as unknown as ReturnType<typeof useProject>);
      render(<ProjectLayout />);
      expect(screen.getByText("Project not found")).toBeInTheDocument();
    });
  });

  describe("with project data — renders the project", () => {
    it("renders the Test Suites tab link", () => {
      vi.mocked(useProject).mockReturnValue({
        data: makeProject(),
        isPending: false,
        isError: false,
      } as unknown as ReturnType<typeof useProject>);
      render(<ProjectLayout />);
      expect(
        screen.getByRole("link", { name: /test suites/i }),
      ).toBeInTheDocument();
    });

    it("renders the Test Runs tab link", () => {
      vi.mocked(useProject).mockReturnValue({
        data: makeProject(),
        isPending: false,
        isError: false,
      } as unknown as ReturnType<typeof useProject>);
      render(<ProjectLayout />);
      expect(
        screen.getByRole("link", { name: /test runs/i }),
      ).toBeInTheDocument();
    });

    it("links the settings tab to the project settings page", () => {
      vi.mocked(useProject).mockReturnValue({
        data: makeProject(),
        isPending: false,
        isError: false,
      } as unknown as ReturnType<typeof useProject>);
      render(<ProjectLayout />);
      expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
        "href",
        "/projects/$projectId/settings",
      );
    });
  });

  describe("project navigation", () => {
    it("keeps the other project sections visible alongside Settings", () => {
      vi.mocked(useProject).mockReturnValue({
        data: makeProject(),
        isPending: false,
        isError: false,
      } as unknown as ReturnType<typeof useProject>);

      render(<ProjectLayout />);

      expect(
        screen.getByRole("navigation", { name: "Project sections" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /test runs/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Settings" }),
      ).toBeInTheDocument();
    });
  });
});
