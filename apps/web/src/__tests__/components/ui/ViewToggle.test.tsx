import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ViewToggle } from "@/components/ui/ViewToggle";
import { useViewModeStore } from "@/stores/viewMode";

beforeEach(() => {
  useViewModeStore.setState({ viewMode: "grid" });
});

describe("ViewToggle", () => {
  describe("given the default state — grid view is active", () => {
    it("marks the grid button as pressed", () => {
      render(<ViewToggle />);
      expect(screen.getByRole("button", { name: "Grid view" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: "List view" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });
  });

  describe("when the list view button is clicked — switches the view mode", () => {
    it("sets the view mode to list", async () => {
      render(<ViewToggle />);
      await userEvent.click(screen.getByRole("button", { name: "List view" }));
      expect(useViewModeStore.getState().viewMode).toBe("list");
    });
  });

  describe("when the grid view button is clicked — switches the view mode", () => {
    it("sets the view mode to grid", async () => {
      useViewModeStore.setState({ viewMode: "list" });
      render(<ViewToggle />);
      await userEvent.click(screen.getByRole("button", { name: "Grid view" }));
      expect(useViewModeStore.getState().viewMode).toBe("grid");
    });
  });
});
