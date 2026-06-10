import { TestCasePriority } from "@testcraft/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TestCaseForm } from "@/pages/TestSuitePage/TestCaseForm";

describe("TestCaseForm", () => {
  describe("given no defaultValues — renders an empty name field and Medium priority", () => {
    it("name input is empty", () => {
      render(
        <TestCaseForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      expect(screen.getByLabelText("Name")).toHaveValue("");
    });

    it("priority defaults to Medium", () => {
      render(
        <TestCaseForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      expect(screen.getByLabelText("Priority")).toHaveValue(
        TestCasePriority.Medium,
      );
    });
  });

  describe("given defaultValues — pre-fills the fields", () => {
    it("sets the name", () => {
      render(
        <TestCaseForm
          defaultValues={{
            name: "Login succeeds",
            description: "",
            priority: TestCasePriority.High,
          }}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      expect(screen.getByLabelText("Name")).toHaveValue("Login succeeds");
    });

    it("sets the priority", () => {
      render(
        <TestCaseForm
          defaultValues={{
            name: "Login succeeds",
            description: "",
            priority: TestCasePriority.High,
          }}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      expect(screen.getByLabelText("Priority")).toHaveValue(
        TestCasePriority.High,
      );
    });
  });

  describe("when submitted — calls onSubmit with entered values", () => {
    it("passes name, priority, and undefined description when empty", async () => {
      const onSubmit = vi.fn();

      render(
        <TestCaseForm
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      await userEvent.type(screen.getByLabelText("Name"), "User can log in");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(onSubmit).toHaveBeenCalledWith({
        name: "User can log in",
        description: undefined,
        priority: TestCasePriority.Medium,
      });
    });
  });

  describe("when Cancel is clicked — calls onCancel", () => {
    it("invokes onCancel once", async () => {
      const onCancel = vi.fn();

      render(
        <TestCaseForm
          onSubmit={vi.fn()}
          onCancel={onCancel}
          isLoading={false}
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });
});
