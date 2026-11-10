import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RerunMenu } from "@/features/testRuns/RerunMenu";

const setup = (failedCount: number, isPending = false) => {
  const onRerun = vi.fn();
  render(
    <RerunMenu
      failedCount={failedCount}
      isPending={isPending}
      onRerun={onRerun}
    />,
  );
  return onRerun;
};

const openMenu = () =>
  userEvent.click(screen.getByRole("button", { name: "Rerun options" }));

describe("RerunMenu", () => {
  it("reruns every test", async () => {
    const onRerun = setup(2);

    await openMenu();
    await userEvent.click(
      screen.getByRole("button", { name: "Rerun all tests" }),
    );

    expect(onRerun).toHaveBeenCalledWith(false);
  });

  it("reruns only the failed and blocked tests and shows how many", async () => {
    const onRerun = setup(3);

    await openMenu();
    await userEvent.click(
      screen.getByRole("button", { name: "Rerun failed & blocked (3)" }),
    );

    expect(onRerun).toHaveBeenCalledWith(true);
  });

  it("disables the failed-only option when nothing failed", async () => {
    setup(0);

    await openMenu();

    expect(
      screen.getByRole("button", { name: "Rerun failed & blocked (0)" }),
    ).toBeDisabled();
  });

  it("disables both options while a rerun is in progress", async () => {
    setup(2, true);

    await openMenu();

    expect(
      screen.getByRole("button", { name: "Rerun all tests" }),
    ).toBeDisabled();
  });
});
