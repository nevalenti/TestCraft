import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormTextarea } from "@/components/ui/FormTextarea";

describe("FormTextarea", () => {
  describe("given no props — renders a basic textarea", () => {
    it("renders a textarea element", () => {
      render(<FormTextarea />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("applies base classes", () => {
      render(<FormTextarea />);
      const textarea = screen.getByRole("textbox");
      expect(textarea.className).toContain("textarea");
      expect(textarea.className).toContain("textarea-bordered");
      expect(textarea.className).toContain("w-full");
    });
  });

  describe("given no hasError prop — does not apply error class", () => {
    it("omits textarea-error class", () => {
      render(<FormTextarea />);
      expect(screen.getByRole("textbox").className).not.toContain(
        "textarea-error",
      );
    });
  });

  describe("given hasError={true} — applies error class", () => {
    it("adds textarea-error class", () => {
      render(<FormTextarea hasError />);
      expect(screen.getByRole("textbox").className).toContain("textarea-error");
    });
  });

  describe("given standard textarea props — passes them through", () => {
    it("sets placeholder", () => {
      render(<FormTextarea placeholder="Enter notes" />);
      expect(screen.getByPlaceholderText("Enter notes")).toBeInTheDocument();
    });

    it("sets rows", () => {
      render(<FormTextarea rows={4} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("rows", "4");
    });
  });

  describe("given a custom className — merges with base classes", () => {
    it("includes the custom class alongside base classes", () => {
      render(<FormTextarea className="font-bold" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea.className).toContain("font-bold");
      expect(textarea.className).toContain("textarea");
    });
  });
});
