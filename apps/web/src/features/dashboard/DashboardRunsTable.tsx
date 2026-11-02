import type { TestRun } from "@testcraft/types";
import type { ReactNode } from "react";

import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePager } from "@/components/ui/TablePager";
import type { SortState } from "@/lib/sort";

export type DashboardSortKey = "name" | "date";

interface DashboardRunsTableProps {
  runs: TestRun[];
  dateLabel: string;
  sort: SortState<DashboardSortKey> | null;
  onSort: (key: DashboardSortKey) => void;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  emptyState: ReactNode;
  renderRow: (run: TestRun) => ReactNode;
}

export const DashboardRunsTable = ({
  runs,
  dateLabel,
  sort,
  onSort,
  page,
  pageCount,
  onPageChange,
  emptyState,
  renderRow,
}: DashboardRunsTableProps) => {
  if (runs.length === 0) return emptyState;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table table-stack table-sm">
          <thead>
            <tr className="border-b border-border text-xs font-semibold tracking-wider text-fg-muted uppercase">
              <SortableHeader
                label="Run"
                sortKey="name"
                sort={sort}
                onSort={onSort}
              />
              <th>Project</th>
              <th>Result</th>
              <SortableHeader
                label={dateLabel}
                sortKey="date"
                sort={sort}
                onSort={onSort}
              />
            </tr>
          </thead>
          <tbody>{runs.map((run) => renderRow(run))}</tbody>
        </table>
      </div>
      <TablePager
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />
    </>
  );
};
