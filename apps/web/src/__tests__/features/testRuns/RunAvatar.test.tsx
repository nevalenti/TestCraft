import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunAvatar } from "@/features/testRuns/RunAvatar";

describe("RunAvatar", () => {
  it("shows the executor photo with their name as alt text", () => {
    render(
      <RunAvatar
        executedByName="Ada Lovelace"
        executedByAvatarUrl="https://example.test/ada.png"
      />,
    );

    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveAttribute(
      "src",
      "https://example.test/ada.png",
    );
  });

  it("falls back to the executor initials", () => {
    render(<RunAvatar executedByName="Ada Lovelace" source="github" />);

    expect(screen.getByTitle("Ada Lovelace")).toHaveTextContent("AL");
  });

  it("uses the source when nobody executed the run", () => {
    render(<RunAvatar source="github" />);

    expect(screen.getByTitle("github")).toHaveTextContent("GI");
  });

  it("marks a run with no executor or source as unknown", () => {
    render(<RunAvatar />);

    expect(screen.getByTitle("Unknown")).toHaveTextContent("?");
  });
});
