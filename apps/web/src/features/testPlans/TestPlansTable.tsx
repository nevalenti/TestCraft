import type { TestPlan } from '@testcraft/types';
import { useState } from 'react';

import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePager } from '@/components/ui/TablePager';
import { TestPlanTableRow } from '@/features/testPlans/TestPlanTableRow';
import { usePagination } from '@/hooks/usePagination';
import { type SortState, toggleSort } from '@/lib/sort';

type PlanSortKey = 'name' | 'date';

const sortPlans = (
  plans: TestPlan[],
  sort: SortState<PlanSortKey> | null,
): TestPlan[] => {
  if (!sort) return plans;

  const { key, direction } = sort;
  const sign = direction === 'asc' ? 1 : -1;

  return plans.toSorted((planA, planB) => {
    if (key === 'name') return sign * planA.name.localeCompare(planB.name);
    return sign * planA.createdAt.localeCompare(planB.createdAt);
  });
};

interface TestPlansTableProps {
  plans: TestPlan[];
  projectId: string;
  onEdit: (plan: TestPlan) => void;
  onDelete: (plan: TestPlan) => void;
}

export const TestPlansTable = ({
  plans,
  projectId,
  onEdit,
  onDelete,
}: TestPlansTableProps) => {
  const [sort, setSort] = useState<SortState<PlanSortKey> | null>(null);
  const sortedPlans = sortPlans(plans, sort);
  const { page, setPage, pageCount, pageItems } = usePagination(sortedPlans);

  const handleSort = (key: PlanSortKey) => {
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
                label="Plan"
                sortKey="name"
                sort={sort}
                onSort={handleSort}
              />
              <th>Description</th>
              <th>Cases</th>
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
            {pageItems.map((plan) => (
              <TestPlanTableRow
                key={plan.id}
                plan={plan}
                projectId={projectId}
                onEdit={() => onEdit(plan)}
                onDelete={() => onDelete(plan)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
};
