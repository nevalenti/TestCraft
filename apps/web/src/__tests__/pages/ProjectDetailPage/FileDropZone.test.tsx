import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FileDropZone } from "@/pages/ProjectDetailPage/FileDropZone";

const makeFile = (name: string, type: string) =>
  new File(["x"], name, { type });

describe("FileDropZone", () => {
  describe("given no files — shows the upload prompt", () => {
    it("shows the click-to-upload hint", () => {
      render(
        <FileDropZone
          id="f"
          accept=".xml"
          files={[]}
          onFilesChange={vi.fn()}
        />,
      );
      expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    });
  });

  describe("given files are selected — shows the file list instead of the prompt", () => {
    it("displays each file's name", () => {
      render(
        <FileDropZone
          id="f"
          accept=".xml"
          files={[makeFile("report.xml", "text/xml")]}
          onFilesChange={vi.fn()}
        />,
      );
      expect(screen.getByText("report.xml")).toBeInTheDocument();
      expect(screen.queryByText(/click to upload/i)).not.toBeInTheDocument();
    });
  });

  describe("when the file input changes — reports all selected files unfiltered", () => {
    it("calls onFilesChange with every file from the input, without accept filtering", () => {
      const onFilesChange = vi.fn();
      render(
        <FileDropZone
          id="f"
          accept=".xml"
          files={[]}
          onFilesChange={onFilesChange}
        />,
      );
      const input = document.querySelector("#f") as HTMLInputElement;
      const file = makeFile("report.json", "application/json");

      fireEvent.change(input, { target: { files: [file] } });

      expect(onFilesChange).toHaveBeenCalledWith([file]);
    });
  });

  describe("when files are dropped", () => {
    it("keeps only files matching the extension accept pattern", () => {
      const onFilesChange = vi.fn();
      render(
        <FileDropZone
          id="f"
          accept=".xml"
          files={[]}
          onFilesChange={onFilesChange}
        />,
      );
      const dropzone = screen.getByRole("button", {
        name: /file upload area/i,
      });
      const matching = makeFile("report.xml", "text/xml");
      const nonMatching = makeFile("report.json", "application/json");

      fireEvent.drop(dropzone, {
        dataTransfer: { files: [matching, nonMatching] },
      });

      expect(onFilesChange).toHaveBeenCalledWith([matching]);
    });

    it("keeps files matching a wildcard mime accept pattern", () => {
      const onFilesChange = vi.fn();
      render(
        <FileDropZone
          id="f"
          accept="image/*"
          files={[]}
          onFilesChange={onFilesChange}
        />,
      );
      const dropzone = screen.getByRole("button", {
        name: /file upload area/i,
      });
      const image = makeFile("shot.png", "image/png");
      const doc = makeFile("notes.txt", "text/plain");

      fireEvent.drop(dropzone, { dataTransfer: { files: [image, doc] } });

      expect(onFilesChange).toHaveBeenCalledWith([image]);
    });

    it("does not call onFilesChange when nothing dropped matches the accept pattern", () => {
      const onFilesChange = vi.fn();
      render(
        <FileDropZone
          id="f"
          accept=".xml"
          files={[]}
          onFilesChange={onFilesChange}
        />,
      );
      const dropzone = screen.getByRole("button", {
        name: /file upload area/i,
      });

      fireEvent.drop(dropzone, {
        dataTransfer: { files: [makeFile("notes.txt", "text/plain")] },
      });

      expect(onFilesChange).not.toHaveBeenCalled();
    });
  });

  describe("when the remove button on a file is clicked", () => {
    it("calls onFilesChange with that file removed", async () => {
      const onFilesChange = vi.fn();
      const fileA = makeFile("a.xml", "text/xml");
      const fileB = makeFile("b.xml", "text/xml");
      render(
        <FileDropZone
          id="f"
          accept=".xml"
          files={[fileA, fileB]}
          onFilesChange={onFilesChange}
        />,
      );

      await userEvent.click(
        screen.getByRole("button", { name: "Remove a.xml" }),
      );

      expect(onFilesChange).toHaveBeenCalledWith([fileB]);
    });
  });
});
