import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "@/components/ui/form/FormField";
import { FormInput } from "@/components/ui/form/FormInput";
import { FormSelect } from "@/components/ui/form/FormSelect";
import { FormTextarea } from "@/components/ui/form/FormTextarea";

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

it("connects nested controls to errors and preserves additional descriptions", () => {
  const { rerender } = render(
    <FormField
      label="Email"
      htmlFor="email"
      error="Email is required"
      hint="Use your work email"
    >
      <div>
        <FormInput aria-describedby="external-help" />
      </div>
      <p id="external-help">Only work addresses</p>
    </FormField>,
  );
  const input = screen.getByRole("textbox", { name: "Email" });
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription(
    "Email is required Only work addresses",
  );
  expect(screen.queryByText("Use your work email")).not.toBeInTheDocument();

  rerender(
    <FormField label="Email" htmlFor="email" hint="Use your work email">
      <FormInput />
    </FormField>,
  );
  expect(
    screen.getByRole("textbox", { name: "Email" }),
  ).toHaveAccessibleDescription("Use your work email");
  expect(screen.getByRole("textbox", { name: "Email" })).not.toHaveAttribute(
    "aria-invalid",
  );
});

it("associates generated labels and feedback with selects and textareas", () => {
  render(
    <>
      <FormField label="Priority" error="Choose a priority">
        <FormSelect>
          <option value="">Choose</option>
        </FormSelect>
      </FormField>
      <FormField label="Description" hint="Optional details">
        <FormTextarea />
      </FormField>
    </>,
  );
  expect(
    screen.getByRole("combobox", { name: "Priority" }),
  ).toHaveAccessibleDescription("Choose a priority");
  expect(screen.getByRole("combobox", { name: "Priority" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(
    screen.getByRole("textbox", { name: "Description" }),
  ).toHaveAccessibleDescription("Optional details");
});

it("marks optional fields next to the label", () => {
  render(
    <FormField label="Description" optional>
      <FormTextarea />
    </FormField>,
  );

  expect(screen.getByText("Optional")).toBeInTheDocument();
  expect(
    screen.getByRole("textbox", { name: /Description/ }),
  ).toBeInTheDocument();
});
