import {
  ArrowRightIcon,
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  FolderIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { TestRunStatus } from "@testcraft/types";
import { compareDesc } from "date-fns";
import { useMemo } from "react";

import { testRunQueries } from "@/api/testRuns";
import { ErrorState } from "@/components/ErrorState";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProjects } from "@/hooks/useProjects";
import { formatDateTime } from "@/lib/format";
import { StatCard } from "@/pages/DashboardPage/StatCard";

export const DashboardPage = () => {
  const {
    data: projects,
    isPending: projectsPending,
    isError,
    error,
  } = useProjects();

  const projectMap = useMemo(
    () => new Map((projects ?? []).map((project) => [project.id, project])),
    [projects],
  );

  const { activeRuns, recentlyCompletedRuns, totalRuns, runsPending } =
    useQueries({
      queries: (projects ?? []).map((project) => ({
        ...testRunQueries.all(project.id),
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
        staleTime: 5000,
      })),
      combine: (results) => {
        const allRuns = results.flatMap((result) => result.data?.items ?? []);
        return {
          activeRuns: allRuns
            .filter((run) => run.status === TestRunStatus.Active)
            .toSorted((a, b) =>
              compareDesc(new Date(a.createdAt), new Date(b.createdAt)),
            )
            .slice(0, 5),
          recentlyCompletedRuns: allRuns
            .filter((run) => run.status === TestRunStatus.Completed)
            .toSorted((a, b) =>
              compareDesc(
                new Date(a.updatedAt ?? a.createdAt),
                new Date(b.updatedAt ?? b.createdAt),
              ),
            )
            .slice(0, 5),
          totalRuns: results.reduce(
            (sum, result) => sum + (result.data?.total ?? 0),
            0,
          ),
          runsPending:
            results.length !== (projects ?? []).length ||
            results.some((result) => result.isPending),
        };
      },
    });

  const completedRunSummaries = useQueries({
    queries: recentlyCompletedRuns.map((run) =>
      testRunQueries.summary(run.projectId, run.id),
    ),
    combine: (results) =>
      new Map(recentlyCompletedRuns.map((run, i) => [run.id, results[i].data])),
  });

  const activeRunSummaries = useQueries({
    queries: activeRuns.map((run) =>
      testRunQueries.summary(run.projectId, run.id),
    ),
    combine: (results) =>
      new Map(activeRuns.map((run, i) => [run.id, results[i].data])),
  });

  useBreadcrumbs([{ label: "Dashboard", href: "/" }]);

  if (isError) return <ErrorState error={error} />;

  const isLoading = projectsPending || runsPending;

  const totalSuites = (projects ?? []).reduce(
    (sum, project) => sum + (project.suiteCount ?? 0),
    0,
  );

  const renderRecentlyCompleted = () => {
    if (recentlyCompletedRuns.length === 0)
      return (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="mb-1 text-sm font-medium text-base-content/50">
            No completed runs
          </p>
          <p className="text-xs text-base-content/35">
            Completed test runs will appear here.
          </p>
        </div>
      );

    return (
      <div className="overflow-hidden rounded-xl border border-border bg-base-100 shadow-sm">
        <ul className="divide-y divide-base-content/8">
          {recentlyCompletedRuns.map((run) => {
            const project = projectMap.get(run.projectId);

            return (
              <li key={run.id}>
                <Link
                  to="/projects/$projectId/runs/$runId"
                  params={{ projectId: run.projectId, runId: run.id }}
                  className="group flex items-center justify-between gap-4 px-5 py-2.5 transition-colors hover:bg-base-200/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {(completedRunSummaries.get(run.id)?.failed ?? 0) > 0 ? (
                      <XCircleIcon className="size-4 shrink-0 text-error" />
                    ) : (
                      <CheckCircleIcon className="size-4 shrink-0 text-success" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {run.name}
                      </p>
                      <p className="truncate text-xs text-base-content/50">
                        {project && (
                          <span className="font-medium text-base-content/65">
                            {project.name}
                          </span>
                        )}
                        {" · "}
                        {run.environment}
                        {" · "}
                        {formatDateTime(run.updatedAt ?? run.createdAt)}
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="size-4 shrink-0 text-base-content/30 transition-transform motion-safe:group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const renderActiveRuns = () => {
    if (activeRuns.length === 0)
      return (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="mb-1 text-sm font-medium text-base-content/50">
            No active runs
          </p>
          <p className="text-xs text-base-content/35">
            Start a test run from any project to track results here.
          </p>
        </div>
      );

    return (
      <div className="overflow-hidden rounded-xl border border-border bg-base-100 shadow-sm">
        <ul className="divide-y divide-base-content/8">
          {activeRuns.map((run) => {
            const project = projectMap.get(run.projectId);

            return (
              <li key={run.id}>
                <Link
                  to="/projects/$projectId/runs/$runId"
                  params={{ projectId: run.projectId, runId: run.id }}
                  className="group flex items-center justify-between gap-4 px-5 py-2.5 transition-colors hover:bg-base-200/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {(activeRunSummaries.get(run.id)?.total ?? 0) === 0 ? (
                      <ClockIcon className="size-4 shrink-0 text-base-content/30" />
                    ) : (
                      <BoltIcon className="size-4 shrink-0 text-warning" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {run.name}
                      </p>
                      <p className="truncate text-xs text-base-content/50">
                        {project && (
                          <span className="font-medium text-base-content/65">
                            {project.name}
                          </span>
                        )}
                        {" · "}
                        {run.environment}
                        {" · "}
                        {formatDateTime(run.createdAt)}
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="size-4 shrink-0 text-base-content/30 transition-transform motion-safe:group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Overview
          </h1>
          <p className="mt-0.5 text-sm text-base-content/55">
            Cross-project status at a glance
          </p>
        </div>
        <Link
          to="/projects"
          className="btn gap-1.5 btn-sm btn-primary"
          aria-label="View all projects"
        >
          <FolderIcon className="size-4" />
          <span className="hidden sm:inline">Projects</span>
        </Link>
      </header>

      <section className="page-content flex flex-col gap-6">
        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <span className="loading loading-lg loading-spinner text-primary" />
          </div>
        ) : (
          <>
            <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label="Projects"
                value={projects?.length ?? 0}
                icon={<FolderIcon className="size-4" />}
                accent="text-primary"
                iconBg="bg-primary/12"
              />
              <StatCard
                label="Test Runs"
                value={totalRuns}
                icon={<BoltIcon className="size-4" />}
                accent="text-warning"
                iconBg="bg-warning/12"
              />
              <StatCard
                label="Test Suites"
                value={totalSuites}
                icon={<ClipboardDocumentListIcon className="size-4" />}
                accent="text-info"
                iconBg="bg-info/12"
              />
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold tracking-widest text-base-content/40 uppercase">
                Active Runs
              </h2>
              {renderActiveRuns()}
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold tracking-widest text-base-content/40 uppercase">
                Recently Completed
              </h2>
              {renderRecentlyCompleted()}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
