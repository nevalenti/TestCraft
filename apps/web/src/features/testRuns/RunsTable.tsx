import type { TestRun, TestRunSummary } from '@testcraft/types';
import { useState } from 'react';

import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePager } from '@/components/ui/TablePager';
import { RunTableRow } from '@/features/testRuns/RunTableRow';
import { usePagination } from '@/hooks/usePagination';
import { type SortState, toggleSort } from '@/lib/sort';

type RunSortKey = 'name' | 'environment' | 'status' | 'date';

const sortRuns = (
  runs: TestRun[],
  sort: SortState<RunSortKey> | null,
): TestRun[] => {
  if (!sort) return runs;

  const { key, direction } = sort;
  const sign = direction === 'asc' ? 1 : -1;

  return runs.toSorted((runA, runB) => {
    if (key === 'name') return sign * runA.name.localeCompare(runB.name);
    if (key === 'environment')
      return sign * runA.environment.localeCompare(runB.environment);
    if (key === 'status') return sign * runA.status.localeCompare(runB.status);
    return sign * runA.createdAt.localeCompare(runB.createdAt);
  });
};

interface RunsTableProps {
  runs: TestRun[];
  projectId: string;
  summaryMap: Map<string, TestRunSummary | undefined>;
  onEdit: (run: TestRun) => void;
  onDelete: (run: TestRun) => void;
}

export const RunsTable = ({
  runs,
  projectId,
  summaryMap,
  onEdit,
  onDelete,
}: RunsTableProps) => {
  const [sort, setSort] = useState<SortState<RunSortKey> | null>(null);
  const sortedRuns = sortRuns(runs, sort);
  const { page, setPage, pageCount, pageItems } = usePagination(sortedRuns);

  const handleSort = (key: RunSortKey) => {
    setSort((previous) => toggleSort(previous, key));
    setPage(0);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-base-100 shadow-card">
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr className="border-b border-border text-xs font-semibold tracking-wider text-base-content/70 uppercase">
              <SortableHeader
                label="Run"
                sortKey="name"
                sort={sort}
                onSort={handleSort}
              />
              <SortableHeader
                label="Environment"
                sortKey="environment"
                sort={sort}
                onSort={handleSort}
              />
              <th>Source</th>
              <SortableHeader
                label="Status"
                sortKey="status"
                sort={sort}
                onSort={handleSort}
              />
              <th>Results</th>
              <SortableHeader
                label="Created"
                sortKey="date"
                sort={sort}
                onSort={handleSort}
              />
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {pageItems.map((run) => (
              <RunTableRow
                key={run.id}
                run={run}
                summary={summaryMap.get(run.id)}
                projectId={projectId}
                onEdit={() => onEdit(run)}
                onDelete={() => onDelete(run)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
};
