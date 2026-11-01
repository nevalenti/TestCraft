import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CodeEditor } from "@/components/ui/CodeEditor";

vi.mock("@/lib/monacoEnvironment", () => ({}));

vi.mock("@monaco-editor/react", () => ({
  default: ({
    value,
    language,
    onChange,
    options,
    loading,
  }: {
    value: string;
    language: string;
    onChange: (value: string | undefined) => void;
    options?: { readOnly?: boolean };
    loading?: React.ReactNode;
  }) => (
    <>
      {loading}
      <textarea
        data-language={language}
        readOnly={options?.readOnly}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </>
  ),
}));

describe("CodeEditor", () => {
  it("shows a spinner while Monaco loads", () => {
    render(<CodeEditor value="" onChange={vi.fn()} />);

    expect(screen.getByRole("status", { name: "Loading editor" })).toHaveClass(
      "loading",
      "loading-spinner",
    );
  });

  describe("given a value — renders it in the editor", () => {
    it("displays the value", () => {
      render(<CodeEditor value='{"a":1}' onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue('{"a":1}');
    });
  });

  describe("given a language prop — passes it through to the editor", () => {
    it("sets the data-language attribute", () => {
      render(<CodeEditor value="" onChange={vi.fn()} language="typescript" />);
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "data-language",
        "typescript",
      );
    });
  });

  describe("given no language prop — defaults to json", () => {
    it("sets json as the language", () => {
      render(<CodeEditor value="" onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "data-language",
        "json",
      );
    });
  });

  describe("given readOnly — marks the editor as read-only", () => {
    it("sets the readOnly attribute", () => {
      render(<CodeEditor value="" onChange={vi.fn()} readOnly />);
      expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    });
  });

  describe("given user input — calls onChange with the new value", () => {
    it("invokes the callback", async () => {
      const onChange = vi.fn();
      render(<CodeEditor value="" onChange={onChange} />);
      await userEvent.type(screen.getByRole("textbox"), "x");
      expect(onChange).toHaveBeenCalledWith("x");
    });
  });
});
