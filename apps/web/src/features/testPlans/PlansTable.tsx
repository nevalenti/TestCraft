import type { TestPlan } from "@testcraft/types";
import { useState } from "react";

import { SortableHeader } from "@/components/ui/SortableHeader";
import { TablePager } from "@/components/ui/TablePager";
import { PlanTableRow } from "@/features/testPlans/PlanTableRow";
import { usePagination } from "@/hooks/usePagination";
import { type SortState, toggleSort } from "@/lib/sort";

type PlanSortKey = "name" | "date";

const sortPlans = (
  plans: TestPlan[],
  sort: SortState<PlanSortKey> | null,
): TestPlan[] => {
  if (!sort) return plans;

  const { key, direction } = sort;
  const sign = direction === "asc" ? 1 : -1;

  return plans.toSorted((planA, planB) => {
    if (key === "name") return sign * planA.name.localeCompare(planB.name);
    return sign * planA.created_at.localeCompare(planB.created_at);
  });
};

interface PlansTableProps {
  plans: TestPlan[];
  projectId: string;
  onEdit?: (plan: TestPlan) => void;
  onDelete?: (plan: TestPlan) => void;
  serverPage?: number;
  serverPageCount?: number;
  onServerPageChange?: (page: number) => void;
  serverSort?: SortState<PlanSortKey> | null;
  onServerSortChange?: (sort: SortState<PlanSortKey> | null) => void;
}

export const PlansTable = ({
  plans,
  projectId,
  onEdit,
  onDelete,
  serverPage,
  serverPageCount,
  onServerPageChange,
  serverSort,
  onServerSortChange,
}: PlansTableProps) => {
  const [sort, setSort] = useState<SortState<PlanSortKey> | null>(null);
  const sortedPlans = onServerPageChange ? plans : sortPlans(plans, sort);
  const { page, setPage, pageCount, pageItems } = usePagination(sortedPlans);
  const displayedPlans = onServerPageChange ? plans : pageItems;
  const activeSort = onServerPageChange ? (serverSort ?? null) : sort;

  const showDescription = plans.some((entry) => entry.description);

  const handleSort = (key: PlanSortKey) => {
    if (onServerSortChange) {
      onServerSortChange(toggleSort(serverSort ?? null, key));
      onServerPageChange?.(0);
      return;
    }
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
                label="Plan"
                sortKey="name"
                sort={activeSort}
                onSort={handleSort}
              />
              {showDescription && <th>Description</th>}
              <th>Cases</th>
              <SortableHeader
                label="Created"
                sortKey="date"
                sort={activeSort}
                onSort={handleSort}
              />
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {displayedPlans.map((plan) => (
              <PlanTableRow
                key={plan.id}
                plan={plan}
                projectId={projectId}
                onEdit={onEdit && (() => onEdit(plan))}
                onDelete={onDelete && (() => onDelete(plan))}
                showDescription={showDescription}
              />
            ))}
          </tbody>
        </table>
      </div>
      {onServerPageChange && serverPage !== undefined ? (
        <TablePager
          page={serverPage}
          pageCount={serverPageCount ?? 0}
          onPageChange={onServerPageChange}
        />
      ) : (
        <TablePager page={page} pageCount={pageCount} onPageChange={setPage} />
      )}
    </div>
  );
};
