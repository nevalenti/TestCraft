import type { TestCase } from "@testcraft/types";
import { TestCasePriority } from "@testcraft/types";

import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePager } from "@/components/ui/TablePager";
import { CaseTableRow } from "@/features/testCases/CaseTableRow";
import { usePagination } from "@/hooks/usePagination";
import { usePersistentSort } from "@/hooks/usePersistentSort";
import { type SortState, toggleSort } from "@/lib/sort";

const SORT_KEYS = ["name", "priority", "date"] as const;
type TestCaseSortKey = (typeof SORT_KEYS)[number];

const PRIORITY_RANK: Record<TestCasePriority, number> = {
  [TestCasePriority.Low]: 0,
  [TestCasePriority.Medium]: 1,
  [TestCasePriority.High]: 2,
  [TestCasePriority.Critical]: 3,
};

const sortTestCases = (
  testCases: TestCase[],
  sort: SortState<TestCaseSortKey> | null,
): TestCase[] => {
  if (!sort) return testCases;

  const { key, direction } = sort;
  const sign = direction === "asc" ? 1 : -1;

  return testCases.toSorted((caseA, caseB) => {
    if (key === "name") return sign * caseA.name.localeCompare(caseB.name);
    if (key === "priority")
      return (
        sign * (PRIORITY_RANK[caseA.priority] - PRIORITY_RANK[caseB.priority])
      );
    return sign * caseA.created_at.localeCompare(caseB.created_at);
  });
};

interface CasesTableProps {
  testCases: TestCase[];
  projectId: string;
  suiteId: string;
  onEdit?: (testCase: TestCase) => void;
  onDelete?: (testCase: TestCase) => void;
}

export const CasesTable = ({
  testCases,
  projectId,
  suiteId,
  onEdit,
  onDelete,
}: CasesTableProps) => {
  const [sort, setSort] = usePersistentSort("test-cases", SORT_KEYS);
  const sortedTestCases = sortTestCases(testCases, sort);
  const { page, setPage, pageCount, pageItems } =
    usePagination(sortedTestCases);

  const showDescription = testCases.some((testCase) => testCase.description);
  const showLabels = testCases.some((testCase) => testCase.labels?.length);

  const handleSort = (key: TestCaseSortKey) => {
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
                label="Case"
                sortKey="name"
                sort={sort}
                onSort={handleSort}
              />
              {showDescription && <th>Description</th>}
              {showLabels && <th>Labels</th>}
              <th>Steps</th>
              <SortableHeader
                label="Priority"
                sortKey="priority"
                sort={sort}
                onSort={handleSort}
              />
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
            {pageItems.map((testCase) => (
              <CaseTableRow
                key={testCase.id}
                testCase={testCase}
                projectId={projectId}
                suiteId={suiteId}
                onEdit={onEdit && (() => onEdit(testCase))}
                onDelete={onDelete && (() => onDelete(testCase))}
                showDescription={showDescription}
                showLabels={showLabels}
              />
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
};
