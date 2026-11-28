import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  describe("given a title — always renders it", () => {
    it("displays the title", () => {
      render(<EmptyState title="No projects yet" />);
      expect(screen.getByText("No projects yet")).toBeInTheDocument();
    });
  });

  describe("given a description — renders it", () => {
    it("displays the supporting copy", () => {
      render(
        <EmptyState
          title="No projects yet"
          description="Create a project to get started."
        />,
      );
      expect(
        screen.getByText("Create a project to get started."),
      ).toBeInTheDocument();
    });
  });

  describe("given an action — renders it", () => {
    it("displays the action element", () => {
      render(
        <EmptyState title="Empty" action={<button>Create First</button>} />,
      );
      expect(
        screen.getByRole("button", { name: "Create First" }),
      ).toBeInTheDocument();
    });
  });

  describe("given a secondary action — renders both actions", () => {
    it("displays the primary and secondary actions", () => {
      render(
        <EmptyState
          title="Empty"
          action={<button>Create First</button>}
          secondaryAction={<a href="/help">Learn more</a>}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Create First" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Learn more" }),
      ).toBeInTheDocument();
    });
  });

  describe("without an action — omits the action slot", () => {
    it("renders no extra buttons", () => {
      render(<EmptyState title="Empty" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("given a custom icon — renders it instead of the default", () => {
    it("renders the custom icon", () => {
      render(
        <EmptyState title="Empty" icon={<span data-testid="custom-icon" />} />,
      );
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  describe("given compact — renders the compact layout", () => {
    it("still shows the title, description, and action", () => {
      render(
        <EmptyState
          compact
          title="Empty"
          description="Nothing here yet."
          action={<button>Add one</button>}
        />,
      );
      expect(screen.getByText("Empty")).toBeInTheDocument();
      expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Add one" }),
      ).toBeInTheDocument();
    });
  });
});
