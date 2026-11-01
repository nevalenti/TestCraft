import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Modal } from "@/components/ui/Modal";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("Modal", () => {
  describe("when isOpen is true — renders title and children", () => {
    it("displays the title", () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Edit Project">
          <p>Form content</p>
        </Modal>,
      );
      expect(
        screen.getByRole("dialog", { name: "Edit Project" }),
      ).toBeInTheDocument();
    });

    it("renders the children", () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Edit Project">
          <p>Form content</p>
        </Modal>,
      );
      expect(screen.getByText("Form content")).toBeInTheDocument();
    });

    it("shows a close button with an accessible label", () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Edit Project">
          <p>content</p>
        </Modal>,
      );
      expect(
        screen.getByRole("button", { name: "Close dialog" }),
      ).toBeInTheDocument();
    });
  });

  describe("when isOpen is false — does not render current children", () => {
    it("hides the children", () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()} title="Edit Project">
          <p>Hidden content</p>
        </Modal>,
      );
      expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
    });
  });

  describe("when the close button is clicked — calls onClose", () => {
    it("invokes onClose once", async () => {
      const onClose = vi.fn();

      render(
        <Modal isOpen={true} onClose={onClose} title="Confirm">
          <p>content</p>
        </Modal>,
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Close dialog" }),
      );
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe("when isOpen toggles open → closed — caches children during close animation", () => {
    it("retains the last rendered children after closing", () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test">
          <p>Cached content</p>
        </Modal>,
      );

      rerender(
        <Modal isOpen={false} onClose={vi.fn()} title="Test">
          <p>Cached content</p>
        </Modal>,
      );
      expect(screen.getByText("Cached content")).toBeInTheDocument();
    });
  });
});

it("focuses the first form control on opening and returns focus on closing", async () => {
  const opener = document.createElement("button");
  document.body.append(opener);
  opener.focus();
  const { rerender } = render(
    <Modal isOpen={true} onClose={vi.fn()} title="Edit">
      <input aria-label="Name" />
    </Modal>,
  );
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
  const dialog = screen.getByRole("dialog", { name: "Edit" });
  rerender(
    <Modal isOpen={false} onClose={vi.fn()} title="Edit">
      <input aria-label="Name" />
    </Modal>,
  );
  fireEvent(dialog, new Event("close"));
  expect(opener).toHaveFocus();
  opener.remove();
});

it("describes the dialog with its description", () => {
  render(
    <Modal
      isOpen
      onClose={vi.fn()}
      title="New Test Suite"
      description="Group related test cases together."
    >
      <p>Body</p>
    </Modal>,
  );

  expect(
    screen.getByRole("dialog", { hidden: true }),
  ).toHaveAccessibleDescription("Group related test cases together.");
});
