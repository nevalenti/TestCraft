import {
  getCoreRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import type { TestResult } from "@testcraft/types";
import { useMemo, useState } from "react";

import {
  RESULTS_PAGE_SIZE,
  type ResultSortKey,
} from "@/features/testResults/api";
import { createColumns } from "@/features/testResults/columns";
import { useTestResults } from "@/features/testResults/hooks";
import { useRunPageSearch } from "@/pages/run/useRunPageSearch";

interface ResultActions {
  onEdit?: (result: TestResult) => void;
  onDelete?: (result: TestResult) => void;
  onAttachment: (result: TestResult) => void;
}

export const useRunResults = (
  projectId: string,
  runId: string,
  { onEdit, onDelete, onAttachment }: ResultActions,
) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: RESULTS_PAGE_SIZE,
  });

  const resetPage = () =>
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));

  const filters = useRunPageSearch(resetPage);
  const { statusFilter, debouncedSearch } = filters;

  const sort = sorting[0];
  const results = useTestResults(
    projectId,
    runId,
    statusFilter ?? undefined,
    debouncedSearch || undefined,
    pagination.pageIndex + 1,
    sort?.id as ResultSortKey | undefined,
    sort && (sort.desc ? "desc" : "asc"),
  );
  const resultsPage = results.data;

  const showNotes = !!resultsPage?.items.some((result) => result.notes);
  const columns = useMemo(
    () => createColumns({ onEdit, onDelete, onAttachment, showNotes }),
    [onEdit, onDelete, onAttachment, showNotes],
  );

  const pageCount = resultsPage
    ? Math.ceil(resultsPage.total / pagination.pageSize)
    : -1;

  const table = useReactTable({
    data: resultsPage?.items ?? [],
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: (next) => {
      setSorting(next);
      resetPage();
    },
    pageCount,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return { ...filters, results, table, pageCount };
};
