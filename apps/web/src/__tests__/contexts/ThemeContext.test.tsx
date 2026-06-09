import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";

const clearThemeCookie = () => {
  document.cookie = "app-theme=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
};

const BareConsumer = () => {
  useTheme();
  return null;
};

const TestConsumer = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <>
      <span data-testid="state">{isDark ? "dim" : "dracula"}</span>
      <button onClick={toggleTheme}>toggle</button>
    </>
  );
};

beforeEach(clearThemeCookie);
afterEach(clearThemeCookie);

describe("ThemeProvider", () => {
  describe("ThemeProvider — on initial render with no cookie — defaults to light theme", () => {
    it("exposes isDark as false", () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );
      expect(screen.getByTestId("state")).toHaveTextContent("dracula");
    });

    it("sets data-theme to the light value on the document element", () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );
      expect(document.documentElement.dataset.theme).toBe("dracula");
    });
  });

  describe("ThemeProvider — when toggleTheme is called — switches to dark theme", () => {
    it("updates isDark to true", async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );
      await userEvent.click(screen.getByRole("button", { name: "toggle" }));
      expect(screen.getByTestId("state")).toHaveTextContent("dim");
    });

    it("updates the data-theme attribute to the dark value", async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );
      await userEvent.click(screen.getByRole("button", { name: "toggle" }));
      expect(document.documentElement.dataset.theme).toBe("dim");
    });
  });

  describe("ThemeProvider — when toggled twice — returns to light theme", () => {
    it("isDark is false again", async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      );
      await userEvent.click(screen.getByRole("button", { name: "toggle" }));
      await userEvent.click(screen.getByRole("button", { name: "toggle" }));
      expect(screen.getByTestId("state")).toHaveTextContent("dracula");
    });
  });
});

describe("useTheme", () => {
  describe("useTheme — when used outside ThemeProvider — throws a descriptive error", () => {
    it("throws with the expected message", () => {
      expect(() => render(<BareConsumer />)).toThrow(
        "useTheme must be used inside ThemeProvider",
      );
    });
  });
});
