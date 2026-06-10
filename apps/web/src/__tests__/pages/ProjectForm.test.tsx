import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProjectForm } from "@/pages/ProjectsPage/ProjectForm";

describe("ProjectForm", () => {
  describe("given no defaultValues — renders empty fields", () => {
    it("name input is empty", () => {
      render(
        <ProjectForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      expect(screen.getByLabelText("Name")).toHaveValue("");
    });

    it("description textarea is empty", () => {
      render(
        <ProjectForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      );
      expect(screen.getByLabelText("Description")).toHaveValue("");
    });
  });

  describe("given defaultValues — pre-fills the fields", () => {
    it("sets the name input value", () => {
      render(
        <ProjectForm
          defaultValues={{ name: "Alpha", description: "A project" }}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      expect(screen.getByLabelText("Name")).toHaveValue("Alpha");
    });

    it("sets the description textarea value", () => {
      render(
        <ProjectForm
          defaultValues={{ name: "Alpha", description: "A project" }}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      expect(screen.getByLabelText("Description")).toHaveValue("A project");
    });
  });

  describe("when submitted with a name — calls onSubmit with the entered values", () => {
    it("passes name and undefined description when description is empty", async () => {
      const onSubmit = vi.fn();

      render(
        <ProjectForm
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      await userEvent.type(screen.getByLabelText("Name"), "My Project");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(onSubmit).toHaveBeenCalledWith({
        name: "My Project",
        description: undefined,
      });
    });

    it("passes the description when filled", async () => {
      const onSubmit = vi.fn();

      render(
        <ProjectForm
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          isLoading={false}
        />,
      );
      await userEvent.type(screen.getByLabelText("Name"), "Alpha");
      await userEvent.type(screen.getByLabelText("Description"), "Some desc");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Alpha",
        description: "Some desc",
      });
    });
  });

  describe("when Cancel is clicked — calls onCancel", () => {
    it("invokes onCancel once", async () => {
      const onCancel = vi.fn();

      render(
        <ProjectForm
          onSubmit={vi.fn()}
          onCancel={onCancel}
          isLoading={false}
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe("when isLoading is true — disables the submit button", () => {
    it("the Save button is disabled", () => {
      const { container } = render(
        <ProjectForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={true} />,
      );

      expect(container.querySelector('button[type="submit"]')).toBeDisabled();
    });
  });
});
