import { TestCasePriority } from "@testcraft/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PriorityBadge } from "@/components/ui/PriorityBadge";

describe("PriorityBadge", () => {
  describe("PriorityBadge — given undefined priority — renders nothing", () => {
    it("returns null without crashing", () => {
      const { container } = render(<PriorityBadge priority={undefined} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("PriorityBadge — given Low priority — renders the correct label", () => {
    it('displays "Low"', () => {
      render(<PriorityBadge priority={TestCasePriority.Low} />);
      expect(screen.getByText("Low")).toBeInTheDocument();
    });
  });

  describe("PriorityBadge — given Medium priority — renders the correct label", () => {
    it('displays "Medium"', () => {
      render(<PriorityBadge priority={TestCasePriority.Medium} />);
      expect(screen.getByText("Medium")).toBeInTheDocument();
    });
  });

  describe("PriorityBadge — given High priority — renders the correct label", () => {
    it('displays "High"', () => {
      render(<PriorityBadge priority={TestCasePriority.High} />);
      expect(screen.getByText("High")).toBeInTheDocument();
    });
  });

  describe("PriorityBadge — given Critical priority — renders the correct label", () => {
    it('displays "Critical"', () => {
      render(<PriorityBadge priority={TestCasePriority.Critical} />);
      expect(screen.getByText("Critical")).toBeInTheDocument();
    });
  });
});
