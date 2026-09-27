import type { TestSuite } from '@testcraft/types';
import { useState } from 'react';

import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePager } from '@/components/ui/TablePager';
import { SuiteTableRow } from '@/features/testSuites/SuiteTableRow';
import { usePagination } from '@/hooks/usePagination';
import { type SortState, toggleSort } from '@/lib/sort';

type SuiteSortKey = 'name' | 'date';

const sortSuites = (
  suites: TestSuite[],
  sort: SortState<SuiteSortKey> | null,
): TestSuite[] => {
  if (!sort) return suites;

  const { key, direction } = sort;
  const sign = direction === 'asc' ? 1 : -1;

  return suites.toSorted((suiteA, suiteB) => {
    if (key === 'name') return sign * suiteA.name.localeCompare(suiteB.name);
    return sign * suiteA.createdAt.localeCompare(suiteB.createdAt);
  });
};

interface SuitesTableProps {
  suites: TestSuite[];
  projectId: string;
  onEdit: (suite: TestSuite) => void;
  onDelete: (suite: TestSuite) => void;
}

export const SuitesTable = ({
  suites,
  projectId,
  onEdit,
  onDelete,
}: SuitesTableProps) => {
  const [sort, setSort] = useState<SortState<SuiteSortKey> | null>(null);
  const sortedSuites = sortSuites(suites, sort);
  const { page, setPage, pageCount, pageItems } = usePagination(sortedSuites);

  const handleSort = (key: SuiteSortKey) => {
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
                label="Suite"
                sortKey="name"
                sort={sort}
                onSort={handleSort}
              />
              <th>Description</th>
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
                onEdit={() => onEdit(suite)}
                onDelete={() => onDelete(suite)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
};
