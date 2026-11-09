import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RunsTabs } from "@/features/dashboard/RunsTabs";

const setup = (tab: "active" | "completed" = "active") => {
  const onChange = vi.fn();
  render(
    <RunsTabs
      tab={tab}
      onChange={onChange}
      activeCount={2}
      completedCount={5}
    />,
  );
  return onChange;
};

describe("RunsTabs", () => {
  it("exposes a tablist with only the selected tab in the tab order", () => {
    setup("active");

    expect(screen.getByRole("tab", { name: /Active Runs/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("tab", { name: /Recently Completed/ }),
    ).toHaveAttribute("tabindex", "-1");
  });

  it("moves to the next tab with ArrowRight and wraps with ArrowLeft", async () => {
    const onChange = setup("active");
    screen.getByRole("tab", { name: /Active Runs/ }).focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("completed");

    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith("completed");
  });
});
