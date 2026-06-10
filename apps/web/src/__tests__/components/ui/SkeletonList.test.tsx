import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SkeletonList } from "@/components/ui/SkeletonList";

describe("SkeletonList", () => {
  describe("given no count prop — renders 6 skeleton rows by default", () => {
    it("has 6 aria-hidden skeleton rows", () => {
      const { container } = render(<SkeletonList />);

      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
        6,
      );
    });
  });

  describe("given a custom count — renders that many skeleton rows", () => {
    it("renders 3 rows when count is 3", () => {
      const { container } = render(<SkeletonList count={3} />);

      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
        3,
      );
    });
  });

  describe("has accessible loading state", () => {
    it("marks the list container as busy", () => {
      render(<SkeletonList />);
      expect(screen.getByRole("generic", { busy: true })).toBeInTheDocument();
    });
  });
});
