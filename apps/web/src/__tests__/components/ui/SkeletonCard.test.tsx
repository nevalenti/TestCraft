import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SkeletonCard } from "@/components/ui/SkeletonCard";

describe("SkeletonCard", () => {
  describe("renders a loading placeholder hidden from assistive technology", () => {
    it("has aria-hidden set to true", () => {
      const { container } = render(<SkeletonCard />);
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("renders skeleton elements", () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
    });
  });
});
