import { flexRender, type Table } from "@tanstack/react-table";
import type { TestResult } from "@testcraft/types";

import { TablePager } from "@/components/ui/TablePager";
import { getSortIcon } from "@/lib/sort";

const ariaSort = (
  direction: false | "asc" | "desc",
): "ascending" | "descending" | "none" => {
  if (direction === "asc") return "ascending";
  if (direction === "desc") return "descending";
  return "none";
};

const MOBILE_HIDDEN_COLUMNS = new Set(["index", "notes"]);

interface ResultsTableProps {
  table: Table<TestResult>;
  pageCount: number;
}

export const ResultsTable = ({ table, pageCount }: ResultsTableProps) => {
  const { pageIndex } = table.getState().pagination;

  return (
    <div className="table-shell">
      <div className="overflow-x-auto">
        <table className="table table-stack table-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border text-xs font-semibold tracking-wider text-fg-muted uppercase"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    aria-sort={
                      header.column.getCanSort()
                        ? ariaSort(header.column.getIsSorted())
                        : undefined
                    }
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1.5 text-left"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <span className="text-fg-subtle" aria-hidden="true">
                          {getSortIcon(header.column.getIsSorted())}
                        </span>
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
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
                className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    data-mobile-hide={
                      MOBILE_HIDDEN_COLUMNS.has(cell.column.id) || undefined
                    }
                    data-primary={
                      cell.column.id === "test_case_name" || undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager
        page={pageIndex}
        pageCount={pageCount}
        onPageChange={table.setPageIndex}
      />
    </div>
  );
};
