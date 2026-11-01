import type { TestSuite } from "@testcraft/types";

import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePager } from "@/components/ui/TablePager";
import { SuiteTableRow } from "@/features/testSuites/SuiteTableRow";
import { usePagination } from "@/hooks/usePagination";
import { usePersistentSort } from "@/hooks/usePersistentSort";
import { type SortState, toggleSort } from "@/lib/sort";

const SORT_KEYS = ["name", "date"] as const;
type SuiteSortKey = (typeof SORT_KEYS)[number];

const sortSuites = (
  suites: TestSuite[],
  sort: SortState<SuiteSortKey> | null,
): TestSuite[] => {
  if (!sort) return suites;

  const { key, direction } = sort;
  const sign = direction === "asc" ? 1 : -1;

  return suites.toSorted((suiteA, suiteB) => {
    if (key === "name") return sign * suiteA.name.localeCompare(suiteB.name);
    return sign * suiteA.created_at.localeCompare(suiteB.created_at);
  });
};

interface SuitesTableProps {
  suites: TestSuite[];
  projectId: string;
  onEdit?: (suite: TestSuite) => void;
  onDelete?: (suite: TestSuite) => void;
}

export const SuitesTable = ({
  suites,
  projectId,
  onEdit,
  onDelete,
}: SuitesTableProps) => {
  const [sort, setSort] = usePersistentSort("suites", SORT_KEYS);
  const sortedSuites = sortSuites(suites, sort);
  const { page, setPage, pageCount, pageItems } = usePagination(sortedSuites);

  const showDescription = suites.some((entry) => entry.description);

  const handleSort = (key: SuiteSortKey) => {
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
                label="Suite"
                sortKey="name"
                sort={sort}
                onSort={handleSort}
              />
              {showDescription && <th>Description</th>}
              <th>Source</th>
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
            {pageItems.map((suite) => (
              <SuiteTableRow
                key={suite.id}
                suite={suite}
                projectId={projectId}
                onEdit={onEdit && (() => onEdit(suite))}
                onDelete={onDelete && (() => onDelete(suite))}
                showDescription={showDescription}
              />
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
};
