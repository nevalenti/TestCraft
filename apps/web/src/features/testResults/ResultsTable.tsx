import { flexRender, type Table } from '@tanstack/react-table';
import type { TestResult } from '@testcraft/types';

import { TablePager } from '@/components/ui/TablePager';
import { getSortIcon } from '@/lib/sort';

interface ResultsTableProps {
  table: Table<TestResult>;
  pageCount: number;
}

export const ResultsTable = ({ table, pageCount }: ResultsTableProps) => {
  const { pageIndex } = table.getState().pagination;

  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-card">
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border text-xs font-semibold tracking-wider text-base-content/70 uppercase"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : ''
                    }
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() && (
                        <span className="text-base-content/50">
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
                className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
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
      <TablePager
        page={pageIndex}
        pageCount={pageCount}
        onPageChange={table.setPageIndex}
      />
    </div>
  );
};
