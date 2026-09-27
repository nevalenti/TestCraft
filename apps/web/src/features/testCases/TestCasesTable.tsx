import type { TestCase } from '@testcraft/types';
import { TestCasePriority } from '@testcraft/types';
import { useState } from 'react';

import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePager } from '@/components/ui/TablePager';
import { TestCaseTableRow } from '@/features/testCases/TestCaseTableRow';
import { usePagination } from '@/hooks/usePagination';
import { type SortState, toggleSort } from '@/lib/sort';

type TestCaseSortKey = 'name' | 'priority' | 'date';

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
  const sign = direction === 'asc' ? 1 : -1;

  return testCases.toSorted((caseA, caseB) => {
    if (key === 'name') return sign * caseA.name.localeCompare(caseB.name);
    if (key === 'priority')
      return (
        sign * (PRIORITY_RANK[caseA.priority] - PRIORITY_RANK[caseB.priority])
      );
    return sign * caseA.createdAt.localeCompare(caseB.createdAt);
  });
};

interface TestCasesTableProps {
  testCases: TestCase[];
  projectId: string;
  suiteId: string;
  onEdit: (testCase: TestCase) => void;
  onDelete: (testCase: TestCase) => void;
}

export const TestCasesTable = ({
  testCases,
  projectId,
  suiteId,
  onEdit,
  onDelete,
}: TestCasesTableProps) => {
  const [sort, setSort] = useState<SortState<TestCaseSortKey> | null>(null);
  const sortedTestCases = sortTestCases(testCases, sort);
  const { page, setPage, pageCount, pageItems } =
    usePagination(sortedTestCases);

  const handleSort = (key: TestCaseSortKey) => {
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
                label="Case"
                sortKey="name"
                sort={sort}
                onSort={handleSort}
              />
              <th>Description</th>
              <th>Labels</th>
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
              <TestCaseTableRow
                key={testCase.id}
                testCase={testCase}
                projectId={projectId}
                suiteId={suiteId}
                onEdit={() => onEdit(testCase)}
                onDelete={() => onDelete(testCase)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
};
