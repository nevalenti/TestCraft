import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "@/components/ui/FormField";

describe("FormField", () => {
  describe("given a label and children — renders both", () => {
    it("displays the label text", () => {
      render(
        <FormField label="Name">
          <input />
        </FormField>,
      );
      expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("renders the children", () => {
      render(
        <FormField label="Name">
          <input data-testid="child-input" />
        </FormField>,
      );
      expect(screen.getByTestId("child-input")).toBeInTheDocument();
    });
  });

  describe("given an htmlFor prop — associates the label with the input", () => {
    it("sets the for attribute on the label", () => {
      render(
        <FormField label="Email" htmlFor="email-input">
          <input id="email-input" />
        </FormField>,
      );
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });
  });
});
