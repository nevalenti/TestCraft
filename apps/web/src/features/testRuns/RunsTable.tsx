import { type TestRun, TestRunStatus } from "@testcraft/types";

import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePager } from "@/components/ui/TablePager";
import { useTestRunSummaries } from "@/features/testRuns/hooks";
import { RunTableRow } from "@/features/testRuns/RunTableRow";
import { usePagination } from "@/hooks/usePagination";
import { usePersistentSort } from "@/hooks/usePersistentSort";
import { type SortState, toggleSort } from "@/lib/sort";

const SORT_KEYS = ["name", "environment", "status", "date"] as const;
type RunSortKey = (typeof SORT_KEYS)[number];

const sortRuns = (
  runs: TestRun[],
  sort: SortState<RunSortKey> | null,
): TestRun[] => {
  if (!sort) return runs;

  const { key, direction } = sort;
  const sign = direction === "asc" ? 1 : -1;

  return runs.toSorted((runA, runB) => {
    if (key === "name") return sign * runA.name.localeCompare(runB.name);
    if (key === "environment")
      return sign * runA.environment.localeCompare(runB.environment);
    if (key === "status") return sign * runA.status.localeCompare(runB.status);
    return sign * runA.created_at.localeCompare(runB.created_at);
  });
};

interface RunsTableProps {
  runs: TestRun[];
  projectId: string;
  onEdit?: (run: TestRun) => void;
  onDelete?: (run: TestRun) => void;
}

export const RunsTable = ({
  runs,
  projectId,
  onEdit,
  onDelete,
}: RunsTableProps) => {
  const [sort, setSort] = usePersistentSort("runs", SORT_KEYS);
  const sortedRuns = sortRuns(runs, sort);
  const { page, setPage, pageCount, pageItems } = usePagination(sortedRuns);
  const summaryMap = useTestRunSummaries(
    pageItems.filter((run) => run.status === TestRunStatus.Completed),
  );

  const handleSort = (key: RunSortKey) => {
    setSort((previous) => toggleSort(previous, key));
    setPage(0);
  };

  return (
    <div className="table-shell">
      <div className="overflow-x-auto">
        <table className="table table-stack table-sm">
          <thead>
            <tr className="border-b border-border text-xs font-semibold tracking-wider text-fg-muted uppercase">
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
                onEdit={onEdit && (() => onEdit(run))}
                onDelete={onDelete && (() => onDelete(run))}
              />
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
};
