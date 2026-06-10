import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { flexRender, type Table } from "@tanstack/react-table";
import type { TestResult } from "@testcraft/types";

const getSortIcon = (sorted: false | "asc" | "desc"): string => {
  if (sorted === "asc") return "▲";
  if (sorted === "desc") return "▼";

  return "⬍";
};

interface ResultsTableProps {
  table: Table<TestResult>;
  pageCount: number;
}

export const ResultsTable = ({ table, pageCount }: ResultsTableProps) => {
  const { pageIndex } = table.getState().pagination;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
        <table className="table table-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="text-xs text-base-content/60">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : ""
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() && (
                        <span className="text-base-content/30">
                          {getSortIcon(header.column.getIsSorted())}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-testid="result-row"
                className="group transition-colors hover:bg-base-200/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="px-3 text-sm text-base-content/60">
            Page{" "}
            <span className="font-semibold text-base-content">
              {pageIndex + 1}
            </span>{" "}
            of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              className="btn btn-square btn-ghost btn-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              className="btn btn-square btn-ghost btn-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
