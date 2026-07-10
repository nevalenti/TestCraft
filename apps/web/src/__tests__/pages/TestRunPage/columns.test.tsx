import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { TestResult } from "@testcraft/types";
import { DefectType, TestResultStatus } from "@testcraft/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createColumns } from "@/pages/TestRunPage/columns";

const baseResult: TestResult = {
  id: "res1",
  testCaseId: "c1",
  testCaseName: "Login works",
  status: TestResultStatus.Passed,
  notes: undefined,
  durationMs: 1500,
  executedAt: "2026-01-01T10:00:00Z",
} as TestResult;

const renderTable = (
  data: TestResult[],
  onEdit = vi.fn(),
  onDelete = vi.fn(),
  onAttachment = vi.fn(),
) => {
  const columns = createColumns({ onEdit, onDelete, onAttachment });

  const Table = () => {
    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    return (
      <table>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return { ...render(<Table />), onEdit, onDelete, onAttachment };
};

describe("createColumns", () => {
  describe("the index column", () => {
    it("numbers rows starting at 1 on the first page", () => {
      renderTable([baseResult, { ...baseResult, id: "res2" }]);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  describe("the status column", () => {
    it("does not show a defect badge for a passed result", () => {
      renderTable([{ ...baseResult, status: TestResultStatus.Passed }]);

      expect(screen.queryByText("Product Bug")).not.toBeInTheDocument();
    });

    it("shows the defect badge for a failed result with a defect type", () => {
      renderTable([
        {
          ...baseResult,
          status: TestResultStatus.Failed,
          defectType: DefectType.ProductBug,
        },
      ]);

      expect(screen.getByText("Product Bug")).toBeInTheDocument();
    });

    it("does not show a defect badge for a failed result with no defect type set", () => {
      renderTable([
        {
          ...baseResult,
          status: TestResultStatus.Failed,
          defectType: undefined,
        },
      ]);

      expect(
        screen.queryByText(/bug|issue|investigate/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("the notes column", () => {
    it("shows an em-dash placeholder when there are no notes", () => {
      renderTable([{ ...baseResult, notes: undefined }]);

      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("shows the note text when present", () => {
      renderTable([{ ...baseResult, notes: "Flaky on CI" }]);

      expect(screen.getByText("Flaky on CI")).toBeInTheDocument();
    });
  });

  describe("the actions column", () => {
    it("invokes onAttachment with the row's result when the attachment button is clicked", async () => {
      const { onAttachment } = renderTable([baseResult]);

      await userEvent.click(
        screen.getByRole("button", { name: /manage attachments/i }),
      );

      expect(onAttachment).toHaveBeenCalledWith(baseResult);
    });
  });
});
