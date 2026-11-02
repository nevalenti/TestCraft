import { TestResultStatus } from "@testcraft/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResultStatusBadge } from "@/components/ui/ResultStatusBadge";

describe("ResultStatusBadge", () => {
  describe("ResultStatusBadge — given Passed status — renders the correct label", () => {
    it('displays "Passed"', () => {
      render(<ResultStatusBadge status={TestResultStatus.Passed} />);
      expect(screen.getByText("Passed")).toBeInTheDocument();
    });
  });

  describe("ResultStatusBadge — given Failed status — renders the correct label", () => {
    it('displays "Failed"', () => {
      render(<ResultStatusBadge status={TestResultStatus.Failed} />);
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });
  });

  describe("ResultStatusBadge — given Blocked status — renders the correct label", () => {
    it('displays "Blocked"', () => {
      render(<ResultStatusBadge status={TestResultStatus.Blocked} />);
      expect(screen.getByText("Blocked")).toBeInTheDocument();
    });
  });

  describe("ResultStatusBadge — given Skipped status — renders the correct label", () => {
    it('displays "Skipped"', () => {
      render(<ResultStatusBadge status={TestResultStatus.Skipped} />);
      expect(screen.getByText("Skipped")).toBeInTheDocument();
    });
  });

  describe("ResultStatusBadge — given any status — renders a badge element", () => {
    it("renders a span element", () => {
      const { container } = render(
        <ResultStatusBadge status={TestResultStatus.Passed} />,
      );

      expect(container.querySelector("span")).toBeInTheDocument();
    });
  });
});
