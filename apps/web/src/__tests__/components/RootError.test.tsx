import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RootError } from "@/components/RootError";

describe("RootError", () => {
  describe("given an error — shows the heading and the error's message", () => {
    it("displays the error message", () => {
      render(<RootError error={new Error("Router blew up")} />);
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("Router blew up")).toBeInTheDocument();
    });
  });

  describe("when Reload page is clicked — reloads the page", () => {
    let reload: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      reload = vi.fn();
      Object.defineProperty(globalThis, "location", {
        value: { ...location, reload },
        writable: true,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("calls location.reload", async () => {
      render(<RootError error={new Error("Boom")} />);

      await userEvent.click(
        screen.getByRole("button", { name: /reload page/i }),
      );

      expect(reload).toHaveBeenCalledTimes(1);
    });
  });
});
