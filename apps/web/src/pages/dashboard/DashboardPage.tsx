import {
  CheckCircleIcon,
  ClockIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { Link } from "@tanstack/react-router";
import type { TestRun } from "@testcraft/types";
import { compareDesc } from "date-fns";
import { useMemo } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActiveRunTableRow } from "@/features/dashboard/ActiveRunTableRow";
import { CompletedRunTableRow } from "@/features/dashboard/CompletedRunTableRow";
import {
  DashboardRunsTable,
  type DashboardSortKey,
} from "@/features/dashboard/DashboardRunsTable";
import { DashboardSkeleton } from "@/features/dashboard/DashboardSkeleton";
import {
  useDashboardRuns,
  useDashboardSummary,
} from "@/features/dashboard/hooks";
import { NeedsAttention } from "@/features/dashboard/NeedsAttention";
import { ProjectHealthList } from "@/features/dashboard/ProjectHealthList";
import { RunsTabs } from "@/features/dashboard/RunsTabs";
import { StatTiles } from "@/features/dashboard/StatTiles";
import { useDashboardRealtime } from "@/features/dashboard/useDashboardRealtime";
import { useProjects } from "@/features/projects/hooks";
import { useTestRunSummaries } from "@/features/testRuns/hooks";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { usePagination } from "@/hooks/usePagination";
import { usePersistentSort } from "@/hooks/usePersistentSort";
import { type SortState, toggleSort } from "@/lib/sort";
import { useDashboardTabStore } from "@/stores/dashboardTab";

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

  const projectIds = useMemo(
    () => (projects ?? []).map((project) => project.id),
    [projects],
  );
  const { isConnected } = useDashboardRealtime(projectIds);

  const {
    activeRuns: activeRunsUnsorted,
    completedRuns: recentlyCompletedRunsAll,
    activeCount,
    completedCount,
    isPending: runsPending,
    isError: runsError,
    error: runsQueryError,
    refetch: refetchRuns,
  } = useDashboardRuns(projectIds, {
    refetchInterval: isConnected ? false : 30_000,
    refetchIntervalInBackground: false,
    staleTime: 5000,
  });

  const activeRunsAll = activeRunsUnsorted.toSorted((runA, runB) =>
    compareDesc(new Date(runA.created_at), new Date(runB.created_at)),
  );
  const [activeSort, setActiveSort] = usePersistentSort(
    "dashboard-active",
    DASHBOARD_SORT_KEYS,
  );
  const [completedSort, setCompletedSort] = usePersistentSort(
    "dashboard-completed",
    DASHBOARD_SORT_KEYS,
  );

  const sortedActiveRunsAll = sortRuns(
    activeRunsAll,
    activeSort,
    (run) => run.created_at,
  );
  const sortedCompletedRunsAll = sortRuns(
    recentlyCompletedRunsAll,
    completedSort,
    (run) => run.updated_at ?? run.created_at,
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

  useBreadcrumbs([{ label: "Dashboard", href: "/" }]);

  const {
    data: summary,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useDashboardSummary();

  const isLoading = projectsPending || runsPending;
  const showSkeleton = useIsLoadingVisible(isLoading);

  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (runsError)
    return (
      <ErrorState error={runsQueryError} onRetry={() => void refetchRuns()} />
    );

  const isContentReady = !isLoading && !showSkeleton;

  const activeBody = (
    <DashboardRunsTable
      runs={activeRuns}
      dateLabel="Started"
      sort={activeSort}
      onSort={handleActiveSort}
      page={safeActivePageIndex}
      pageCount={activePageCount}
      onPageChange={setActivePageIndex}
      emptyState={
        <EmptyState
          icon={<ClockIcon className="size-5" />}
          iconClassName="text-warning"
          title="No active runs"
          description="Active test runs will appear here."
        />
      }
      renderRow={(run) => (
        <ActiveRunTableRow
          key={run.id}
          run={run}
          project={projectMap.get(run.project_id)}
          summary={activeRunSummaries.get(run.id)}
        />
      )}
    />
  );

  const completedBody = (
    <DashboardRunsTable
      runs={recentlyCompletedRuns}
      dateLabel="Completed"
      sort={completedSort}
      onSort={handleCompletedSort}
      page={safeCompletedPageIndex}
      pageCount={completedPageCount}
      onPageChange={setCompletedPageIndex}
      emptyState={
        <EmptyState
          icon={<CheckCircleIcon className="size-5" />}
          iconClassName="text-success"
          title="No completed runs"
          description="Completed test runs will appear here."
        />
      }
      renderRow={(run) => (
        <CompletedRunTableRow
          key={run.id}
          run={run}
          project={projectMap.get(run.project_id)}
          summary={completedRunSummaries.get(run.id)}
        />
      )}
    />
  );

  const hasProjects = (projects?.length ?? 0) > 0;

  const renderTiles = () => {
    if (isSummaryError)
      return (
        <ErrorState
          title="Failed to load the weekly summary"
          error={summaryError}
          onRetry={() => void refetchSummary()}
        />
      );

    return summary && <StatTiles summary={summary} />;
  };

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto">
      <PageHeader
        title="Dashboard"
        description={
          summary
            ? `How your projects did over the last ${summary.window_days} days.`
            : "How your projects are doing."
        }
      />
      {!isContentReady && showSkeleton && (
        <div role="status" aria-live="polite">
          <span className="sr-only">Loading dashboard…</span>
          <DashboardSkeleton />
        </div>
      )}
      {isContentReady && !hasProjects && (
        <section className="page-content">
          <EmptyState
            icon={<RectangleStackIcon className="size-6" />}
            title="No projects yet"
            description="Create a project to start tracking test runs and results."
            action={
              <Link to="/projects" className="btn btn-sm btn-primary">
                Go to projects
              </Link>
            }
          />
        </section>
      )}
      {isContentReady && hasProjects && (
        <section className="page-content flex flex-col gap-4">
          {renderTiles()}
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0 table-shell">
              <RunsTabs
                tab={tab}
                onChange={setTab}
                activeCount={activeCount}
                completedCount={completedCount}
              />

              {tab === "active" ? activeBody : completedBody}
            </div>
            {summary && (
              <aside
                aria-label="Weekly summary"
                className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1"
              >
                <NeedsAttention
                  tests={summary.top_failing_tests}
                  windowDays={summary.window_days}
                />
                <ProjectHealthList projects={projects ?? []} />
              </aside>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
