import {
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  FolderIcon,
} from '@heroicons/react/24/solid';
import type { Project, TestRun } from '@testcraft/types';
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
import { StatCard } from '@/features/dashboard/StatCard';
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

type DashboardSortKey = 'name' | 'project' | 'environment' | 'date';

const sortRuns = (
  runs: TestRun[],
  sort: SortState<DashboardSortKey> | null,
  projectMap: Map<string, Project>,
  dateOf: (run: TestRun) => string,
): TestRun[] => {
  if (!sort) return runs;

  const { key, direction } = sort;
  const sign = direction === 'asc' ? 1 : -1;

  return runs.toSorted((runA, runB) => {
    if (key === 'name') return sign * runA.name.localeCompare(runB.name);
    if (key === 'environment')
      return sign * runA.environment.localeCompare(runB.environment);
    if (key === 'project') {
      const nameA = projectMap.get(runA.projectId)?.name ?? '';
      const nameB = projectMap.get(runB.projectId)?.name ?? '';
      return sign * nameA.localeCompare(nameB);
    }
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

  const {
    runs: allRuns,
    total: totalRuns,
    isPending: runsPending,
  } = useProjectsTestRuns(
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
    projectMap,
    (run) => run.createdAt,
  );
  const sortedCompletedRunsAll = sortRuns(
    recentlyCompletedRunsAll,
    completedSort,
    projectMap,
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

  const totalSuites = (projects ?? []).reduce(
    (sum, project) => sum + (project.suiteCount ?? 0),
    0,
  );

  const loadedSummaries = [
    ...activeRunSummaries.values(),
    ...completedRunSummaries.values(),
  ].filter((summary) => summary != null);
  const loadedPassed = loadedSummaries.reduce(
    (sum, summary) => sum + summary.passed,
    0,
  );
  const loadedFailed = loadedSummaries.reduce(
    (sum, summary) => sum + summary.failed,
    0,
  );
  const loadedTotal = loadedPassed + loadedFailed;
  const recentPassRate =
    loadedTotal > 0 ? Math.round((loadedPassed / loadedTotal) * 100) : null;

  const displayName =
    keycloak.tokenParsed?.name ?? keycloak.tokenParsed?.preferred_username;
  const firstName = displayName?.split(' ', 1)[0];

  const activeRunsPanel =
    activeRuns.length === 0 ? (
      <EmptyState
        icon={<ClockIcon className="size-5" />}
        iconClassName="border-warning/20 bg-warning/10 text-warning"
        title="No active runs"
        description="Start a test run from any project to track results here."
      />
    ) : (
      <div className="overflow-hidden rounded-2xl border border-border bg-base-100 shadow-card">
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
                <SortableHeader
                  label="Project"
                  sortKey="project"
                  sort={activeSort}
                  onSort={handleActiveSort}
                />
                <SortableHeader
                  label="Environment"
                  sortKey="environment"
                  sort={activeSort}
                  onSort={handleActiveSort}
                />
                <th>Progress</th>
                <th>Results</th>
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
      </div>
    );

  const completedRunsPanel =
    recentlyCompletedRuns.length === 0 ? (
      <EmptyState
        icon={<CheckCircleIcon className="size-5" />}
        iconClassName="border-success/20 bg-success/10 text-success"
        title="No completed runs"
        description="Completed test runs will appear here."
      />
    ) : (
      <div className="overflow-hidden rounded-2xl border border-border bg-base-100 shadow-card">
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
                <SortableHeader
                  label="Project"
                  sortKey="project"
                  sort={completedSort}
                  onSort={handleCompletedSort}
                />
                <SortableHeader
                  label="Environment"
                  sortKey="environment"
                  sort={completedSort}
                  onSort={handleCompletedSort}
                />
                <th>Progress</th>
                <th>Results</th>
                <th>Pass Rate</th>
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
      </div>
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
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-base-content sm:text-3xl">
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
            <div className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-base-100 shadow-card sm:flex-row [&>*+*]:border-t [&>*+*]:border-base-content/8 sm:[&>*+*]:border-t-0 sm:[&>*+*]:border-l">
              <StatCard
                label="Projects"
                value={projects?.length ?? 0}
                icon={<FolderIcon className="size-5" />}
                accentText="text-primary"
                cardBg="card-bg-primary"
                to="/projects"
                description="Click to view all projects"
                testId="stat-projects"
              />
              <StatCard
                label="Test Runs"
                value={totalRuns}
                icon={<BoltIcon className="size-5" />}
                accentText="text-warning"
                cardBg="card-bg-warning"
                description={
                  recentPassRate === null
                    ? 'Across all projects'
                    : `${recentPassRate}% recent pass rate`
                }
                testId="stat-runs"
              />
              <StatCard
                label="Test Suites"
                value={totalSuites}
                icon={<ClipboardDocumentListIcon className="size-5" />}
                accentText="text-success"
                cardBg="card-bg-success"
                description={`Across ${projects?.length ?? 0} project${projects?.length === 1 ? '' : 's'}`}
                testId="stat-suites"
              />
            </div>

            <div className="flex flex-col gap-3">
              <RunsTabs
                tab={tab}
                onChange={setTab}
                activeCount={activeRunsAll.length}
                completedCount={recentlyCompletedRunsAll.length}
              />

              {tab === 'active' ? activeRunsPanel : completedRunsPanel}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
