import { PlusIcon } from '@heroicons/react/24/solid';
import type { Table } from '@tanstack/react-table';
import type { Paginated, TestResult, TestResultStatus } from '@testcraft/types';

import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ResultsTable } from '@/features/testResults/ResultsTable';

interface ResultsContentProps {
  isPending: boolean;
  isSummaryPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  resultsPage: Paginated<TestResult> | undefined;
  statusFilter: TestResultStatus | null;
  debouncedSearch: string;
  openCreate: () => void;
  onClearSearch: () => void;
  onClearFilter: () => void;
  table: Table<TestResult>;
  pageCount: number;
}

export const ResultsContent = ({
  isPending,
  isSummaryPending,
  isError,
  error,
  onRetry,
  resultsPage,
  statusFilter,
  debouncedSearch,
  openCreate,
  onClearSearch,
  onClearFilter,
  table,
  pageCount,
}: ResultsContentProps) => {
  if (isPending || isSummaryPending)
    return (
      <div className="flex min-h-80 items-center justify-center">
        <span className="loading loading-lg loading-spinner text-primary" />
      </div>
    );

  if (isError) return <ErrorState error={error} onRetry={onRetry} />;

  if (
    resultsPage?.items.length === 0 &&
    statusFilter === null &&
    !debouncedSearch
  )
    return (
      <EmptyState
        title="No results recorded"
        description="Add results to track the outcome of each test case in this run."
        action={
          <button
            className="btn gap-1.5 btn-sm btn-primary"
            onClick={openCreate}
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            Add Result
          </button>
        }
      />
    );

  if (resultsPage?.items.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="mb-2 text-sm font-semibold text-base-content/85">
          No results match
        </p>
        <div className="flex gap-2">
          {debouncedSearch && (
            <button className="btn btn-ghost btn-sm" onClick={onClearSearch}>
              Clear search
            </button>
          )}
          {statusFilter !== null && (
            <button className="btn btn-outline btn-sm" onClick={onClearFilter}>
              Clear filter
            </button>
          )}
        </div>
      </div>
    );

  return <ResultsTable table={table} pageCount={pageCount} />;
};
