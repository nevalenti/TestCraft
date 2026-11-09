import type { TestRun } from "@testcraft/types";
import { useMemo } from "react";

import type { DashboardSortKey } from "@/features/dashboard/DashboardRunsTable";
import { usePagination } from "@/hooks/usePagination";
import { usePersistentSort } from "@/hooks/usePersistentSort";
import { type SortState, toggleSort } from "@/lib/sort";

const DASHBOARD_SORT_KEYS: readonly DashboardSortKey[] = ["name", "date"];

const sortRuns = (
  runs: TestRun[],
  sort: SortState<DashboardSortKey> | null,
  dateOf: (run: TestRun) => string,
): TestRun[] => {
  if (!sort) return runs;

  const { key, direction } = sort;
  const sign = direction === "asc" ? 1 : -1;

  return runs.toSorted((runA, runB) => {
    if (key === "name") return sign * runA.name.localeCompare(runB.name);
    return sign * dateOf(runA).localeCompare(dateOf(runB));
  });
};

export const useSortedRunsPage = (
  storageKey: string,
  runs: TestRun[],
  dateOf: (run: TestRun) => string,
) => {
  const [sort, setSort] = usePersistentSort(storageKey, DASHBOARD_SORT_KEYS);
  const sortedRuns = useMemo(
    () => sortRuns(runs, sort, dateOf),
    [runs, sort, dateOf],
  );
  const { page, setPage, pageCount, pageItems } = usePagination(sortedRuns);

  const onSort = (key: DashboardSortKey) => {
    setSort((previous) => toggleSort(previous, key));
    setPage(0);
  };

  return { sort, onSort, page, setPage, pageCount, pageItems };
};
