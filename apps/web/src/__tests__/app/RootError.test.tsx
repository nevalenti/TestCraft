import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/errorReporting", () => ({ reportError: vi.fn() }));

import { RootError } from "@/app/RootError";
import { reportError } from "@/lib/errorReporting";

describe("RootError", () => {
  describe("given an error — shows the heading and the error's message", () => {
    it("displays the error message", () => {
      render(<RootError error={new Error("Router blew up")} />);
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("Router blew up")).toBeInTheDocument();
    });
  });

  it("reports the error, since route errors never reach an error boundary", () => {
    const error = new Error("Loader failed");
    render(<RootError error={error} />);
    expect(reportError).toHaveBeenCalledWith(error);
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
