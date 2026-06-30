import {
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
import keycloak from "@/auth/keycloak";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { StatCard } from "@/pages/DashboardPage/StatCard";

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const getRunAvatarLabel = (executedByName?: string, source?: string) => {
  if (executedByName) return getInitials(executedByName);
  if (source) return source.slice(0, 2).toUpperCase();
  return "?";
};

const RunAvatar = ({
  executedByName,
  source,
}: {
  executedByName?: string;
  source?: string;
}) => {
  const label = getRunAvatarLabel(executedByName, source);
  const title = executedByName ?? source ?? "Unknown";
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-base-content/8 text-[10px] font-bold text-base-content/55 tabular-nums"
      title={title}
    >
      {label}
    </span>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

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

  const displayName =
    keycloak.tokenParsed?.name ?? keycloak.tokenParsed?.preferred_username;
  const firstName = displayName?.split(" ", 1)[0];

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto">
      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center">
          <span className="loading loading-lg loading-spinner text-primary" />
        </div>
      ) : (
        <>
          <header className="px-4 pt-6 pb-5 sm:px-6 lg:px-8">
            <h1 className="page-title text-2xl">
              {firstName ? `${getGreeting()}, ${firstName}` : "Dashboard"}
            </h1>
            <p className="mt-0.5 text-sm text-base-content/55">
              {"Here's an overview of your testing activity."}
            </p>
          </header>

          <section className="page-content flex flex-col gap-8">
            <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label="Projects"
                value={projects?.length ?? 0}
                icon={<FolderIcon className="size-4.5" />}
                accent="text-primary"
                colorVar="--color-primary"
                cardBg="card-bg-primary border"
                to="/projects"
                description="Click to view all projects"
              />
              <StatCard
                label="Test Runs"
                value={totalRuns}
                icon={<BoltIcon className="size-4.5" />}
                accent="text-warning"
                colorVar="--color-warning"
                cardBg="card-bg-warning border"
                description="Across all projects"
              />
              <StatCard
                label="Test Suites"
                value={totalSuites}
                icon={<ClipboardDocumentListIcon className="size-4.5" />}
                accent="text-info"
                colorVar="--color-info"
                cardBg="card-bg-info border"
                description="Across all projects"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-base-content/50 uppercase">
                    Active Runs
                    {activeRuns.length > 0 && (
                      <span className="rounded-full bg-warning/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-warning tabular-nums">
                        {activeRuns.length}
                      </span>
                    )}
                  </h2>
                </div>

                {activeRuns.length === 0 ? (
                  <EmptyState
                    icon={<ClockIcon className="size-5" />}
                    title="No active runs"
                    description="Start a test run from any project to track results here."
                  />
                ) : (
                  <ul className="overflow-hidden rounded-2xl border border-border bg-base-100 shadow-sm [&>li+li]:border-t [&>li+li]:border-base-content/8">
                    {activeRuns.map((run, index) => {
                      const project = projectMap.get(run.projectId);
                      const summary = activeRunSummaries.get(run.id);
                      const resultCount = summary?.total ?? 0;
                      const hasResults = resultCount > 0;

                      return (
                        <li key={run.id} className="relative overflow-hidden">
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-base-content/[0.05] to-transparent"
                            style={{
                              animation: `shine 4s ease-in-out ${index * 0.5}s infinite`,
                            }}
                          />
                          <Link
                            to="/projects/$projectId/runs/$runId"
                            params={{ projectId: run.projectId, runId: run.id }}
                            className="group relative flex items-center gap-3 px-4 py-3 transition-[background-color,box-shadow] duration-150 hover:bg-base-300 hover:shadow-[inset_3px_0_0_var(--color-warning)]"
                          >
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-full",
                                hasResults
                                  ? "bg-warning/12 text-warning"
                                  : "bg-base-content/6 text-base-content/40",
                              )}
                            >
                              {hasResults ? (
                                <BoltIcon className="size-4" />
                              ) : (
                                <ClockIcon className="size-4" />
                              )}
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {run.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-base-content/55">
                                {project && (
                                  <span className="font-medium text-base-content/70">
                                    {project.name}
                                  </span>
                                )}
                                {" · "}
                                {run.environment}
                                {" · "}
                                {formatDateTime(run.createdAt)}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              {hasResults && (
                                <span className="rounded-md bg-warning/8 px-2 py-0.5 font-mono text-xs font-semibold text-warning/80 tabular-nums">
                                  {resultCount} logged
                                </span>
                              )}
                              <RunAvatar
                                executedByName={run.executedByName}
                                source={run.source}
                              />
                              <span className="inline-flex animate-pulse items-center rounded-full border border-warning/22 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-warning uppercase">
                                Live
                              </span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-base-content/50 uppercase">
                  Recently Completed
                  {recentlyCompletedRuns.length > 0 && (
                    <span className="rounded-full bg-base-content/8 px-1.5 py-0.5 font-mono text-[10px] font-bold text-base-content/55 tabular-nums">
                      {recentlyCompletedRuns.length}
                    </span>
                  )}
                </h2>

                {recentlyCompletedRuns.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircleIcon className="size-5" />}
                    title="No completed runs"
                    description="Completed test runs will appear here."
                  />
                ) : (
                  <ul className="overflow-hidden rounded-2xl border border-border bg-base-100 shadow-sm [&>li+li]:border-t [&>li+li]:border-base-content/8">
                    {recentlyCompletedRuns.map((run) => {
                      const project = projectMap.get(run.projectId);
                      const summary = completedRunSummaries.get(run.id);
                      const hasFailed = (summary?.failed ?? 0) > 0;
                      const total = summary?.total ?? 0;
                      const passed = summary?.passed ?? 0;
                      const passRate =
                        total > 0 ? Math.round((passed / total) * 100) : null;

                      return (
                        <li key={run.id}>
                          <Link
                            to="/projects/$projectId/runs/$runId"
                            params={{ projectId: run.projectId, runId: run.id }}
                            className="group flex flex-col gap-2 px-4 py-3 transition-[background-color,box-shadow] duration-150 hover:bg-base-300 hover:shadow-[inset_3px_0_0_var(--color-primary)]"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                                  hasFailed
                                    ? "bg-error/12 text-error"
                                    : "bg-success/12 text-success",
                                )}
                              >
                                {hasFailed ? (
                                  <XCircleIcon className="size-4" />
                                ) : (
                                  <CheckCircleIcon className="size-4" />
                                )}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                  {run.name}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-base-content/55">
                                  {project && (
                                    <span className="font-medium text-base-content/70">
                                      {project.name}
                                    </span>
                                  )}
                                  {" · "}
                                  {run.environment}
                                  {" · "}
                                  {formatDateTime(
                                    run.updatedAt ?? run.createdAt,
                                  )}
                                </p>
                              </div>

                              <RunAvatar
                                executedByName={run.executedByName}
                                source={run.source}
                              />
                              {passRate !== null && (
                                <span
                                  className={cn(
                                    "shrink-0 rounded-md px-2 py-0.5 font-mono text-sm font-bold tabular-nums",
                                    passRate === 100 &&
                                      "bg-success/10 text-success",
                                    passRate !== null &&
                                      passRate < 100 &&
                                      passRate >= 80 &&
                                      "bg-warning/10 text-warning",
                                    passRate !== null &&
                                      passRate < 80 &&
                                      "bg-error/10 text-error",
                                  )}
                                >
                                  {passRate}%
                                </span>
                              )}
                            </div>

                            {summary && total > 0 && (
                              <div className="ml-11 flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    "h-1.5 min-w-0 flex-1 overflow-hidden rounded-full transition-all",
                                    hasFailed ? "bg-error/20" : "bg-success/20",
                                  )}
                                >
                                  <div
                                    className="h-full rounded-full bg-success transition-all"
                                    style={{ width: `${passRate ?? 0}%` }}
                                  />
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  {passed > 0 && (
                                    <span className="flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 font-mono text-xs font-semibold text-success tabular-nums">
                                      {passed}
                                      <CheckCircleIcon className="size-3" />
                                    </span>
                                  )}
                                  {(summary.failed ?? 0) > 0 && (
                                    <span className="flex items-center gap-1 rounded-md bg-error/10 px-2 py-0.5 font-mono text-xs font-semibold text-error tabular-nums">
                                      {summary.failed}
                                      <XCircleIcon className="size-3" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
