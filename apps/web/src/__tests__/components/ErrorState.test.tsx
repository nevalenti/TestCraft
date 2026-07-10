import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ErrorState } from "@/components/ErrorState";

describe("ErrorState", () => {
  describe("given no props — shows the defaults", () => {
    it("shows the default title and a generic message", () => {
      render(<ErrorState onRetry={vi.fn()} />);
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
      expect(
        screen.getByText("Please check your connection and try again."),
      ).toBeInTheDocument();
    });
  });

  describe("given an explicit message — takes priority over everything else", () => {
    it("displays the explicit message even when an error is also provided", () => {
      render(
        <ErrorState
          message="Explicit message"
          error={{ response: { data: { detail: "From error" } } }}
          onRetry={vi.fn()}
        />,
      );
      expect(screen.getByText("Explicit message")).toBeInTheDocument();
      expect(screen.queryByText("From error")).not.toBeInTheDocument();
    });
  });

  describe("given an axios error with a problem-detail — extracts the detail over the title", () => {
    it("prefers detail over title", () => {
      render(
        <ErrorState
          error={{
            response: { data: { title: "Title", detail: "Detail wins" } },
          }}
          onRetry={vi.fn()}
        />,
      );
      expect(screen.getByText("Detail wins")).toBeInTheDocument();
    });
  });

  describe("given an axios error with only a title — falls back to the title", () => {
    it("displays the title", () => {
      render(
        <ErrorState
          error={{ response: { data: { title: "Only a title" } } }}
          onRetry={vi.fn()}
        />,
      );
      expect(screen.getByText("Only a title")).toBeInTheDocument();
    });
  });

  describe("given a custom title — overrides the default", () => {
    it("displays the custom title", () => {
      render(<ErrorState title="Could not load runs" onRetry={vi.fn()} />);
      expect(screen.getByText("Could not load runs")).toBeInTheDocument();
    });
  });

  describe("when Retry is clicked — calls the provided onRetry", () => {
    it("invokes the onRetry callback", async () => {
      const onRetry = vi.fn();
      render(<ErrorState onRetry={onRetry} />);

      await userEvent.click(screen.getByRole("button", { name: /retry/i }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
