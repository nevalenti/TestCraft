import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ExpandableText } from "@/components/ui/ExpandableText";

describe("ExpandableText", () => {
  it("renders short text without a toggle", () => {
    render(<ExpandableText text="short" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("clamps long text and lets keyboard users expand it", async () => {
    render(<ExpandableText text={"word ".repeat(40)} />);
    const toggle = screen.getByRole("button", { name: "Show more" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);

    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
