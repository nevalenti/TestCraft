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

  describe("given a description — renders it below the title", () => {
    it("displays the description text", () => {
      render(
        <EmptyState
          title="No projects yet"
          description="Create one to start"
        />,
      );
      expect(screen.getByText("Create one to start")).toBeInTheDocument();
    });
  });

  describe("without a description — omits the description element", () => {
    it("does not render any description text", () => {
      render(<EmptyState title="Empty" />);
      expect(screen.queryByText("Create one to start")).not.toBeInTheDocument();
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
});
