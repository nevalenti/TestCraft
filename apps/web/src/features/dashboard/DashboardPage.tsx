import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { TestRun } from '@testcraft/types';
import { TestRunStatus } from '@testcraft/types';
import { compareDesc, format } from 'date-fns';
import { useMemo, useState } from 'react';

import keycloak from '@/auth/keycloak';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePager } from '@/components/ui/TablePager';
import { ActiveRunTableRow } from '@/features/dashboard/ActiveRunTableRow';
import { CompletedRunTableRow } from '@/features/dashboard/CompletedRunTableRow';
import { DashboardSkeleton } from '@/features/dashboard/DashboardSkeleton';
import { useDashboardTabStore } from '@/features/dashboard/dashboardTab';
import { RunsTabs } from '@/features/dashboard/RunsTabs';
import { useProjects } from '@/features/projects/hooks';
import {
  useProjectsTestRuns,
  useTestRunSummaries,
} from '@/features/testRuns/hooks';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { usePagination } from '@/hooks/usePagination';
import { type SortState, toggleSort } from '@/lib/sort';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

type DashboardSortKey = 'name' | 'date';

const sortRuns = (
  runs: TestRun[],
  sort: SortState<DashboardSortKey> | null,
  dateOf: (run: TestRun) => string,
): TestRun[] => {
  if (!sort) return runs;

  const { key, direction } = sort;
  const sign = direction === 'asc' ? 1 : -1;

  return runs.toSorted((runA, runB) => {
    if (key === 'name') return sign * runA.name.localeCompare(runB.name);
    return sign * dateOf(runA).localeCompare(dateOf(runB));
  });
};

export const DashboardPage = () => {
  const {
    data: projects,
    isPending: projectsPending,
    isError,
    error,
    refetch,
  } = useProjects();

  const projectMap = useMemo(
    () => new Map((projects ?? []).map((project) => [project.id, project])),
    [projects],
  );

  const { runs: allRuns, isPending: runsPending } = useProjectsTestRuns(
    (projects ?? []).map((project) => project.id),
    {
      refetchInterval: 5000,
      refetchIntervalInBackground: false,
      staleTime: 5000,
    },
  );

  const activeRunsAll = allRuns
    .filter((run) => run.status === TestRunStatus.Active)
    .toSorted((runA, runB) =>
      compareDesc(new Date(runA.createdAt), new Date(runB.createdAt)),
    );
  const recentlyCompletedRunsAll = allRuns
    .filter((run) => run.status === TestRunStatus.Completed)
    .toSorted((runA, runB) =>
      compareDesc(
        new Date(runA.updatedAt ?? runA.createdAt),
        new Date(runB.updatedAt ?? runB.createdAt),
      ),
    );
  const [activeSort, setActiveSort] =
    useState<SortState<DashboardSortKey> | null>(null);
  const [completedSort, setCompletedSort] =
    useState<SortState<DashboardSortKey> | null>(null);

  const sortedActiveRunsAll = sortRuns(
    activeRunsAll,
    activeSort,
    (run) => run.createdAt,
  );
  const sortedCompletedRunsAll = sortRuns(
    recentlyCompletedRunsAll,
    completedSort,
    (run) => run.updatedAt ?? run.createdAt,
  );

  const handleActiveSort = (key: DashboardSortKey) => {
    setActiveSort((previous) => toggleSort(previous, key));
    setActivePageIndex(0);
  };
  const handleCompletedSort = (key: DashboardSortKey) => {
    setCompletedSort((previous) => toggleSort(previous, key));
    setCompletedPageIndex(0);
  };

  const {
    page: safeActivePageIndex,
    setPage: setActivePageIndex,
    pageCount: activePageCount,
    pageItems: activeRuns,
  } = usePagination(sortedActiveRunsAll);
  const {
    page: safeCompletedPageIndex,
    setPage: setCompletedPageIndex,
    pageCount: completedPageCount,
    pageItems: recentlyCompletedRuns,
  } = usePagination(sortedCompletedRunsAll);

  const completedRunSummaries = useTestRunSummaries(recentlyCompletedRuns);
  const activeRunSummaries = useTestRunSummaries(activeRuns);

  const tab = useDashboardTabStore((state) => state.tab);
  const setTab = useDashboardTabStore((state) => state.setTab);

  useBreadcrumbs([{ label: 'Dashboard', href: '/' }]);

  const isLoading = projectsPending || runsPending;
  const showSkeleton = useIsLoadingVisible(isLoading);

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const isContentReady = !isLoading && !showSkeleton;

  const displayName =
    keycloak.tokenParsed?.name ?? keycloak.tokenParsed?.preferred_username;
  const firstName = displayName?.split(' ', 1)[0];

  const activeBody =
    activeRuns.length === 0 ? (
      <EmptyState
        icon={<ClockIcon className="size-5" />}
        iconClassName="text-warning"
        title="No active runs"
        description="Start a test run from any project to track results here."
      />
    ) : (
      <>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold tracking-wider text-base-content/70 uppercase">
                <SortableHeader
                  label="Run"
                  sortKey="name"
                  sort={activeSort}
                  onSort={handleActiveSort}
                />
                <th>Project</th>
                <th>Result</th>
                <SortableHeader
                  label="Started"
                  sortKey="date"
                  sort={activeSort}
                  onSort={handleActiveSort}
                />
              </tr>
            </thead>
            <tbody>
              {activeRuns.map((run) => (
                <ActiveRunTableRow
                  key={run.id}
                  run={run}
                  project={projectMap.get(run.projectId)}
                  summary={activeRunSummaries.get(run.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <TablePager
          page={safeActivePageIndex}
          pageCount={activePageCount}
          onPageChange={setActivePageIndex}
        />
      </>
    );

  const completedBody =
    recentlyCompletedRuns.length === 0 ? (
      <EmptyState
        icon={<CheckCircleIcon className="size-5" />}
        iconClassName="text-success"
        title="No completed runs"
        description="Completed test runs will appear here."
      />
    ) : (
      <>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold tracking-wider text-base-content/70 uppercase">
                <SortableHeader
                  label="Run"
                  sortKey="name"
                  sort={completedSort}
                  onSort={handleCompletedSort}
                />
                <th>Project</th>
                <th>Result</th>
                <SortableHeader
                  label="Completed"
                  sortKey="date"
                  sort={completedSort}
                  onSort={handleCompletedSort}
                />
              </tr>
            </thead>
            <tbody>
              {recentlyCompletedRuns.map((run) => (
                <CompletedRunTableRow
                  key={run.id}
                  run={run}
                  project={projectMap.get(run.projectId)}
                  summary={completedRunSummaries.get(run.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <TablePager
          page={safeCompletedPageIndex}
          pageCount={completedPageCount}
          onPageChange={setCompletedPageIndex}
        />
      </>
    );

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto">
      {!isContentReady && showSkeleton && (
        <div role="status" aria-live="polite">
          <span className="sr-only">Loading dashboard…</span>
          <DashboardSkeleton />
        </div>
      )}
      {isContentReady && (
        <>
          <header className="page-header">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <div>
                <h1 className="page-title">
                  {firstName ? `${getGreeting()}, ${firstName}` : 'Dashboard'}
                </h1>
                <p className="mt-1.5 text-sm text-base-content/70">
                  {"Here's an overview of your testing activity."}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <p className="text-xs font-medium text-base-content/60">
                  {format(new Date(), 'EEEE, MMMM d')}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                  <span className="size-1.5 rounded-full bg-success motion-safe:animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </header>

          <section className="page-content flex flex-col gap-8">
            <div className="overflow-hidden rounded-2xl border border-border bg-base-100 shadow-card">
              <RunsTabs
                tab={tab}
                onChange={setTab}
                activeCount={activeRunsAll.length}
                completedCount={recentlyCompletedRunsAll.length}
              />

              {tab === 'active' ? activeBody : completedBody}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
