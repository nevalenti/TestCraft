import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("@tanstack/react-router", () => ({
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
}));

vi.mock("@/hooks/useProjects", () => ({
  useProjects: vi.fn(),
  useCreateProject: vi.fn(),
  useUpdateProject: vi.fn(),
  useDeleteProject: vi.fn(),
}));

vi.mock("@/hooks/useBreadcrumbs", () => ({ useBreadcrumbs: vi.fn() }));

import type { Project } from "@testcraft/types";

import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "@/hooks/useProjects";
import { ProjectsPage } from "@/pages/ProjectsPage/ProjectsPage";

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: "proj-1",
  name: "Alpha",
  description: "An alpha project",
  suiteCount: 2,
  runCount: 1,
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-15T00:00:00.000Z",
  ...overrides,
});

const noopMutation = { mutate: vi.fn(), isPending: false };

const setupMocks = (projects: Project[] | undefined = [makeProject()]) => {
  vi.mocked(useProjects).mockReturnValue({
    data: projects,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useProjects>);
  vi.mocked(useCreateProject).mockReturnValue(
    noopMutation as unknown as ReturnType<typeof useCreateProject>,
  );
  vi.mocked(useUpdateProject).mockReturnValue(
    noopMutation as unknown as ReturnType<typeof useUpdateProject>,
  );
  vi.mocked(useDeleteProject).mockReturnValue(
    noopMutation as unknown as ReturnType<typeof useDeleteProject>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProjectsPage", () => {
  describe("loading state — shows skeleton grid", () => {
    it("renders the skeleton grid when isPending", () => {
      vi.mocked(useProjects).mockReturnValue({
        data: undefined,
        isPending: true,
        isError: false,
      } as unknown as ReturnType<typeof useProjects>);
      vi.mocked(useCreateProject).mockReturnValue(
        noopMutation as unknown as ReturnType<typeof useCreateProject>,
      );
      vi.mocked(useUpdateProject).mockReturnValue(
        noopMutation as unknown as ReturnType<typeof useUpdateProject>,
      );
      vi.mocked(useDeleteProject).mockReturnValue(
        noopMutation as unknown as ReturnType<typeof useDeleteProject>,
      );

      const { container } = render(<ProjectsPage />);

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    });
  });

  describe("error state — shows retry message", () => {
    it("renders the error message", () => {
      vi.mocked(useProjects).mockReturnValue({
        data: undefined,
        isPending: false,
        isError: true,
      } as unknown as ReturnType<typeof useProjects>);
      vi.mocked(useCreateProject).mockReturnValue(
        noopMutation as unknown as ReturnType<typeof useCreateProject>,
      );
      vi.mocked(useUpdateProject).mockReturnValue(
        noopMutation as unknown as ReturnType<typeof useUpdateProject>,
      );
      vi.mocked(useDeleteProject).mockReturnValue(
        noopMutation as unknown as ReturnType<typeof useDeleteProject>,
      );

      render(<ProjectsPage />);
      expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });
  });

  describe("empty state — shows EmptyState component", () => {
    it("renders the no projects message", () => {
      setupMocks([]);
      render(<ProjectsPage />);
      expect(screen.getByText("No projects yet")).toBeInTheDocument();
    });
  });

  describe("with projects — renders project cards", () => {
    it("displays each project name", () => {
      setupMocks([
        makeProject({ name: "Alpha" }),
        makeProject({ id: "proj-2", name: "Beta" }),
      ]);
      render(<ProjectsPage />);
      expect(screen.getByText("Alpha")).toBeInTheDocument();
      expect(screen.getByText("Beta")).toBeInTheDocument();
    });
  });

  describe("New Project button — opens the create modal", () => {
    it("shows the New Project modal heading", async () => {
      setupMocks();
      render(<ProjectsPage />);
      await userEvent.click(
        screen.getByRole("button", { name: /new project/i }),
      );
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "New Project" }),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("search input — is rendered", () => {
    it("shows the search field", () => {
      setupMocks();
      render(<ProjectsPage />);
      expect(
        screen.getByPlaceholderText("Search projects…"),
      ).toBeInTheDocument();
    });
  });
});
