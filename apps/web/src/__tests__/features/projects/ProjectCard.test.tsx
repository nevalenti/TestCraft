import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

import type { Project } from "@testcraft/types";

import { ProjectCard } from "@/features/projects/ProjectCard";

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: "proj-1",
  version: 1,
  name: "Alpha",
  description: "An alpha project",
  suite_count: 3,
  run_count: 2,
  created_at: "2026-01-15T00:00:00.000Z",
  updated_at: "2026-01-15T00:00:00.000Z",
  is_owner: true,
  role: "owner",
  ...overrides,
});

describe("ProjectCard", () => {
  describe("renders project information", () => {
    it("displays the project name", () => {
      render(
        <ProjectCard
          project={makeProject()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText("Alpha")).toBeInTheDocument();
    });

    it("displays the project description", () => {
      render(
        <ProjectCard
          project={makeProject()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText("An alpha project")).toBeInTheDocument();
    });

    it("shows suite and run counts", () => {
      render(
        <ProjectCard
          project={makeProject({ suite_count: 3, run_count: 2 })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText("3 suites")).toBeInTheDocument();
      expect(screen.getByText("2 runs")).toBeInTheDocument();
    });

    it("uses singular label for count of 1", () => {
      render(
        <ProjectCard
          project={makeProject({ suite_count: 1, run_count: 1 })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText("1 suite")).toBeInTheDocument();
      expect(screen.getByText("1 run")).toBeInTheDocument();
    });
  });

  describe("without a description — shows no placeholder", () => {
    it("omits the description line", () => {
      render(
        <ProjectCard
          project={makeProject({ description: undefined })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.queryByText("No description")).not.toBeInTheDocument();
    });
  });

  describe("project health", () => {
    it("shows the latest pass rate and the recent trend", () => {
      render(
        <ProjectCard
          project={makeProject({
            recent_pass_rates: [40, 75.5, 92],
            last_run_at: new Date().toISOString(),
          })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText("92%")).toBeInTheDocument();
      expect(
        screen.getByRole("img", {
          name: "Pass rate of the last 3 completed runs: 40%, 76%, 92%",
        }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Last run/)).toBeInTheDocument();
    });

    it("says so when no runs have completed", () => {
      render(
        <ProjectCard
          project={makeProject({ recent_pass_rates: [], last_run_at: null })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText("No completed runs yet")).toBeInTheDocument();
      expect(screen.getByText("No runs yet")).toBeInTheDocument();
    });
  });

  describe("links to the project detail page", () => {
    it("renders a link to the correct route", () => {
      render(
        <ProjectCard
          project={makeProject()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("link", { name: "Open project" }),
      ).toHaveAttribute("href", "/projects/proj-1");
    });
  });

  describe("action buttons", () => {
    it("calls onEdit when Edit is clicked", async () => {
      const onEdit = vi.fn();

      render(
        <ProjectCard
          project={makeProject()}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />,
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Edit project" }),
      );
      expect(onEdit).toHaveBeenCalledOnce();
    });

    it("calls onDelete when Delete is clicked", async () => {
      const onDelete = vi.fn();

      render(
        <ProjectCard
          project={makeProject()}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />,
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Delete project" }),
      );
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it("hides the Edit and Delete actions for a project the user does not own", () => {
      render(
        <ProjectCard
          project={makeProject({ is_owner: false })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(
        screen.queryByRole("button", { name: "Delete project" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Edit project" }),
      ).not.toBeInTheDocument();
    });
  });
});
