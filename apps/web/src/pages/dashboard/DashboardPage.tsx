import {
  CheckCircleIcon,
  ClockIcon,
  FolderOpenIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { Link } from "@tanstack/react-router";
import type { TestRun } from "@testcraft/types";
import { compareDesc } from "date-fns";
import { useMemo } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ActiveRunTableRow } from "@/features/dashboard/ActiveRunTableRow";
import { CompletedRunTableRow } from "@/features/dashboard/CompletedRunTableRow";
import { DashboardRunsTable } from "@/features/dashboard/DashboardRunsTable";
import { DashboardSkeleton } from "@/features/dashboard/DashboardSkeleton";
import {
  useDashboardRuns,
  useDashboardSummary,
} from "@/features/dashboard/hooks";
import { NeedsAttention } from "@/features/dashboard/NeedsAttention";
import { ProjectHealthList } from "@/features/dashboard/ProjectHealthList";
import { RUNS_PANEL_ID, runsTabId } from "@/features/dashboard/runsTabIds";
import { RunsTabs } from "@/features/dashboard/RunsTabs";
import { StatTiles } from "@/features/dashboard/StatTiles";
import { useDashboardRealtime } from "@/features/dashboard/useDashboardRealtime";
import { useSortedRunsPage } from "@/features/dashboard/useSortedRunsPage";
import { useProjects } from "@/features/projects/hooks";
import { useTestRunSummaries } from "@/features/testRuns/hooks";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { useDashboardTabStore } from "@/stores/dashboardTab";

const startedAt = (run: TestRun) => run.created_at;
const completedAt = (run: TestRun) => run.updated_at ?? run.created_at;

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

  const activeRunsAll = useMemo(
    () =>
      activeRunsUnsorted.toSorted((runA, runB) =>
        compareDesc(new Date(runA.created_at), new Date(runB.created_at)),
      ),
    [activeRunsUnsorted],
  );
  const active = useSortedRunsPage(
    "dashboard-active",
    activeRunsAll,
    startedAt,
  );
  const completed = useSortedRunsPage(
    "dashboard-completed",
    recentlyCompletedRunsAll,
    completedAt,
  );
  const activeRuns = active.pageItems;
  const recentlyCompletedRuns = completed.pageItems;

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
      sort={active.sort}
      onSort={active.onSort}
      page={active.page}
      pageCount={active.pageCount}
      onPageChange={active.setPage}
      emptyState={
        <EmptyState
          className="flex-1"
          icon={<ClockIcon className="size-5" />}
          iconClassName="text-warning"
          title="No active runs"
          description="Runs that are in progress show up here as they report results."
          action={
            <Link to="/projects" className="btn gap-2 btn-sm btn-primary">
              <FolderOpenIcon className="size-4" aria-hidden="true" />
              Open a project
            </Link>
          }
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
      sort={completed.sort}
      onSort={completed.onSort}
      page={completed.page}
      pageCount={completed.pageCount}
      onPageChange={completed.setPage}
      emptyState={
        <EmptyState
          className="flex-1"
          icon={<CheckCircleIcon className="size-5" />}
          iconClassName="text-success"
          title="No completed runs"
          description="Finished runs from all your projects show up here."
          action={
            <Link to="/projects" className="btn gap-2 btn-sm btn-primary">
              <FolderOpenIcon className="size-4" aria-hidden="true" />
              Open a project
            </Link>
          }
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
      <h1 className="sr-only">Dashboard</h1>
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
        <section className="page-content flex flex-col gap-6">
          {renderTiles()}
          <div className="min-w-0 table-shell">
            <RunsTabs
              tab={tab}
              onChange={setTab}
              activeCount={activeCount}
              completedCount={completedCount}
            />

            <div
              role="tabpanel"
              className="flex min-h-80 flex-col"
              id={RUNS_PANEL_ID}
              aria-labelledby={runsTabId(tab)}
            >
              {tab === "active" ? activeBody : completedBody}
            </div>
          </div>
          {summary && (
            <aside
              aria-label="Weekly summary"
              className="grid items-start gap-4 lg:grid-cols-2"
            >
              <NeedsAttention tests={summary.top_failing_tests} />
              <ProjectHealthList projects={projects ?? []} />
            </aside>
          )}
        </section>
      )}
    </div>
  );
};
