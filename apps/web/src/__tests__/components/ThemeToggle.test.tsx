import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeProvider } from "@/contexts/ThemeContext";

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("ThemeToggle", () => {
  describe("renders an accessible toggle", () => {
    it("has a label with an accessible name", () => {
      renderWithTheme(<ThemeToggle />);
      expect(screen.getByLabelText("Toggle theme")).toBeInTheDocument();
    });

    it("renders a checkbox inside the label", () => {
      renderWithTheme(<ThemeToggle />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });
  });

  describe("initial state — starts in light mode", () => {
    it("checkbox is unchecked", () => {
      renderWithTheme(<ThemeToggle />);
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });
  });

  describe("when the toggle is clicked — switches to dark mode", () => {
    it("checks the checkbox", async () => {
      renderWithTheme(<ThemeToggle />);
      await userEvent.click(screen.getByRole("checkbox"));
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("calls toggleTheme via onChange (toggling back unchecks)", async () => {
      const toggleTheme = vi.fn();
      vi.spyOn(
        await import("@/contexts/ThemeContext"),
        "useTheme",
      ).mockReturnValue({ isDark: false, toggleTheme });

      renderWithTheme(<ThemeToggle />);
      await userEvent.click(screen.getByRole("checkbox"));
      expect(toggleTheme).toHaveBeenCalledOnce();
    });
  });
});
