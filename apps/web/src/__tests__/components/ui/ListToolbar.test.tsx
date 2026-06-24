import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListToolbar } from "@/components/ui/ListToolbar";

describe("ListToolbar", () => {
  describe("given a placeholder — renders search input with it", () => {
    it("shows the placeholder text", () => {
      render(
        <ListToolbar search="" onSearch={vi.fn()} placeholder="Search suites…">
          <button>New</button>
        </ListToolbar>,
      );
      expect(screen.getByPlaceholderText("Search suites…")).toBeInTheDocument();
    });
  });

  describe("given children — renders them in the toolbar", () => {
    it("renders the child button", () => {
      render(
        <ListToolbar search="" onSearch={vi.fn()} placeholder="Search…">
          <button>New Item</button>
        </ListToolbar>,
      );
      expect(
        screen.getByRole("button", { name: "New Item" }),
      ).toBeInTheDocument();
    });

    it("renders multiple children", () => {
      render(
        <ListToolbar search="" onSearch={vi.fn()} placeholder="Search…">
          <button>Import</button>
          <button>New</button>
        </ListToolbar>,
      );
      expect(
        screen.getByRole("button", { name: "Import" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
    });
  });

  describe("given a search value — displays it in the input", () => {
    it("reflects the current search value", () => {
      render(
        <ListToolbar search="my query" onSearch={vi.fn()} placeholder="Search…">
          <button>New</button>
        </ListToolbar>,
      );
      expect(screen.getByDisplayValue("my query")).toBeInTheDocument();
    });
  });

  describe("when the user types — calls onSearch with the new value", () => {
    it("invokes onSearch with the typed text", async () => {
      const onSearch = vi.fn();
      render(
        <ListToolbar search="" onSearch={onSearch} placeholder="Search…">
          <button>New</button>
        </ListToolbar>,
      );
      await userEvent.type(screen.getByPlaceholderText("Search…"), "hello");
      expect(onSearch).toHaveBeenCalled();
      expect(onSearch).toHaveBeenLastCalledWith(expect.stringContaining("o"));
    });
  });
});
