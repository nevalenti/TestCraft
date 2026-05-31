import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SuiteForm } from "@/pages/ProjectDetailPage/SuiteForm";

describe("SuiteForm", () => {
  describe("given no defaultValues — renders empty fields", () => {
    it("name input is empty", () => {
      render(
        <SuiteForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      expect(screen.getByLabelText("Name")).toHaveValue("");
    });
  });

  describe("given defaultValues — pre-fills the fields", () => {
    it("sets the name value", () => {
      render(
        <SuiteForm
          defaultValues={{ name: "Login Flow", description: "" }}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      expect(screen.getByLabelText("Name")).toHaveValue("Login Flow");
    });
  });

  describe("when submitted with a name — calls onSubmit", () => {
    it("passes name and undefined description when description is empty", async () => {
      const onSubmit = vi.fn();
      render(
        <SuiteForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />,
      );
      await userEvent.type(screen.getByLabelText("Name"), "Checkout Flow");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Checkout Flow",
        description: undefined,
      });
    });
  });

  describe("when Cancel is clicked — calls onCancel", () => {
    it("invokes onCancel once", async () => {
      const onCancel = vi.fn();
      render(
        <SuiteForm onSubmit={vi.fn()} onCancel={onCancel} isLoading={false} />,
      );
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });
});
