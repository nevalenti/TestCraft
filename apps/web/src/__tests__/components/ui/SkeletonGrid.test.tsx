import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SkeletonGrid } from "@/components/ui/SkeletonGrid";

describe("SkeletonGrid", () => {
  describe("given no count prop — renders 6 skeleton cards by default", () => {
    it("has 6 aria-hidden skeleton cards", () => {
      const { container } = render(<SkeletonGrid />);
      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
        6,
      );
    });
  });

  describe("given a custom count — renders that many skeleton cards", () => {
    it("renders 3 cards when count is 3", () => {
      const { container } = render(<SkeletonGrid count={3} />);
      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
        3,
      );
    });
  });

  describe("has accessible loading state", () => {
    it("marks the grid container as busy", () => {
      render(<SkeletonGrid />);
      expect(screen.getByRole("generic", { busy: true })).toBeInTheDocument();
    });
  });
});
