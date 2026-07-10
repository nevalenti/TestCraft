import { DefectType } from "@testcraft/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DefectTypeBadge } from "@/components/ui/DefectTypeBadge";

describe("DefectTypeBadge", () => {
  describe("given ProductBug — renders the correct label", () => {
    it('displays "Product Bug"', () => {
      render(<DefectTypeBadge type={DefectType.ProductBug} />);
      expect(screen.getByText("Product Bug")).toBeInTheDocument();
    });
  });

  describe("given AutomationBug — renders the correct label", () => {
    it('displays "Automation Bug"', () => {
      render(<DefectTypeBadge type={DefectType.AutomationBug} />);
      expect(screen.getByText("Automation Bug")).toBeInTheDocument();
    });
  });

  describe("given EnvironmentIssue — renders the correct label", () => {
    it('displays "Environment Issue"', () => {
      render(<DefectTypeBadge type={DefectType.EnvironmentIssue} />);
      expect(screen.getByText("Environment Issue")).toBeInTheDocument();
    });
  });

  describe("given ToInvestigate — renders the correct label", () => {
    it('displays "To Investigate"', () => {
      render(<DefectTypeBadge type={DefectType.ToInvestigate} />);
      expect(screen.getByText("To Investigate")).toBeInTheDocument();
    });
  });
});
