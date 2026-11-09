import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";

vi.mock("@/lib/errorReporting", () => ({ reportError: vi.fn() }));

import { reportError } from "@/lib/errorReporting";

let shouldThrow = true;
const Bomb = () => {
  if (shouldThrow) throw new Error("chart exploded");
  return <p>chart</p>;
};

describe("SectionErrorBoundary", () => {
  it("shows an inline alert, reports the error and keeps siblings alive", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    shouldThrow = true;
    render(
      <>
        <p>sibling</p>
        <SectionErrorBoundary title="Chart failed">
          <Bomb />
        </SectionErrorBoundary>
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Chart failed");
    expect(screen.getByText("chart exploded")).toBeInTheDocument();
    expect(screen.getByText("sibling")).toBeInTheDocument();
    expect(reportError).toHaveBeenCalled();

    shouldThrow = false;
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByText("chart")).toBeInTheDocument();
  });
});
