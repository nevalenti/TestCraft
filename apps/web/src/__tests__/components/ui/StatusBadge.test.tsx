import { TestResultStatus } from "@testcraft/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "@/components/ui/StatusBadge";

describe("StatusBadge", () => {
  describe("StatusBadge — given Passed status — renders the correct label", () => {
    it('displays "Passed"', () => {
      render(<StatusBadge status={TestResultStatus.Passed} />);
      expect(screen.getByText("Passed")).toBeInTheDocument();
    });
  });

  describe("StatusBadge — given Failed status — renders the correct label", () => {
    it('displays "Failed"', () => {
      render(<StatusBadge status={TestResultStatus.Failed} />);
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });
  });

  describe("StatusBadge — given Blocked status — renders the correct label", () => {
    it('displays "Blocked"', () => {
      render(<StatusBadge status={TestResultStatus.Blocked} />);
      expect(screen.getByText("Blocked")).toBeInTheDocument();
    });
  });

  describe("StatusBadge — given Skipped status — renders the correct label", () => {
    it('displays "Skipped"', () => {
      render(<StatusBadge status={TestResultStatus.Skipped} />);
      expect(screen.getByText("Skipped")).toBeInTheDocument();
    });
  });

  describe("StatusBadge — given any status — renders a badge element", () => {
    it("renders a span element", () => {
      const { container } = render(
        <StatusBadge status={TestResultStatus.Passed} />,
      );
      expect(container.querySelector("span")).toBeInTheDocument();
    });
  });
});
