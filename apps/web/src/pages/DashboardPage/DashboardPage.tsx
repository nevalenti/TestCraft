import {
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  FolderIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { useQueries } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { TestRunStatus } from '@testcraft/types';
import { compareDesc } from 'date-fns';
import { useMemo } from 'react';

import { testRunQueries } from '@/api/testRuns';
import keycloak from '@/auth/keycloak';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { StatCard } from '@/pages/DashboardPage/StatCard';

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const getRunAvatarLabel = (
  executedByName?: string | null,
  source?: string | null,
) => {
  if (executedByName) return getInitials(executedByName);
  if (source) return source.slice(0, 2).toUpperCase();
  return '?';
};

const RunAvatar = ({
  executedByName,
  executedByAvatarUrl,
  source,
  size = 'size-6',
}: {
  executedByName?: string | null;
  executedByAvatarUrl?: string | null;
  source?: string | null;
  size?: string;
}) => {
  const title = executedByName ?? source ?? 'Unknown';

  if (executedByAvatarUrl) {
    return (
      <img
        src={executedByAvatarUrl}
        alt={title}
        title={title}
        className={cn(size, 'shrink-0 rounded-full object-cover')}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-base-content/8 text-[10px] font-bold text-base-content/70 tabular-nums',
        size,
      )}
      title={title}
    >
      {getRunAvatarLabel(executedByName, source)}
    </span>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
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
            .toSorted((runA, runB) =>
              compareDesc(new Date(runA.createdAt), new Date(runB.createdAt)),
            )
            .slice(0, 10),
          recentlyCompletedRuns: allRuns
            .filter((run) => run.status === TestRunStatus.Completed)
            .toSorted((runA, runB) =>
              compareDesc(
                new Date(runA.updatedAt ?? runA.createdAt),
                new Date(runB.updatedAt ?? runB.createdAt),
              ),
            )
            .slice(0, 10),
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
      new Map(
        recentlyCompletedRuns.map((run, index) => [
          run.id,
          results[index].data,
        ]),
      ),
  });

  const activeRunSummaries = useQueries({
    queries: activeRuns.map((run) =>
      testRunQueries.summary(run.projectId, run.id),
    ),
    combine: (results) =>
      new Map(activeRuns.map((run, index) => [run.id, results[index].data])),
  });

  useBreadcrumbs([{ label: 'Dashboard', href: '/' }]);

  if (isError) return <ErrorState error={error} />;

  const isLoading = projectsPending || runsPending;

  const totalSuites = (projects ?? []).reduce(
    (sum, project) => sum + (project.suiteCount ?? 0),
    0,
  );

  const displayName =
    keycloak.tokenParsed?.name ?? keycloak.tokenParsed?.preferred_username;
  const firstName = displayName?.split(' ', 1)[0];

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto">
      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center">
          <span className="loading loading-lg loading-spinner text-primary" />
        </div>
      ) : (
        <>
          <header className="px-4 pt-6 pb-5 sm:px-6 lg:px-8">
            <h1 className="page-title">
              {firstName ? `${getGreeting()}, ${firstName}` : 'Dashboard'}
            </h1>
            <p className="mt-0.5 text-sm text-base-content/70">
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
                to="/projects"
                description="Click to view all projects"
                testId="stat-projects"
              />
              <StatCard
                label="Test Runs"
                value={totalRuns}
                icon={<BoltIcon className="size-4.5" />}
                accent="text-warning"
                colorVar="--color-warning"
                description="Across all projects"
                testId="stat-runs"
              />
              <StatCard
                label="Test Suites"
                value={totalSuites}
                icon={<ClipboardDocumentListIcon className="size-4.5" />}
                accent="text-success"
                colorVar="--color-success"
                description="Across all projects"
                testId="stat-suites"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-base-content/65 uppercase">
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
                      const passed = summary?.passed ?? 0;
                      const failed = summary?.failed ?? 0;
                      const passRate =
                        resultCount > 0
                          ? Math.round((passed / resultCount) * 100)
                          : 0;

                      return (
                        <li key={run.id} className="relative overflow-hidden">
                          {index < 5 && (
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-base-content/[0.05] to-transparent"
                              style={{
                                animation: `shine 4s ease-in-out ${index * 0.5}s infinite`,
                              }}
                            />
                          )}
                          <Link
                            to="/projects/$projectId/runs/$runId"
                            params={{ projectId: run.projectId, runId: run.id }}
                            className="group relative flex items-center gap-3 px-4 py-2 transition-[background-color,box-shadow] duration-150 hover:bg-base-300 hover:shadow-[inset_3px_0_0_var(--color-warning)]"
                          >
                            <span
                              className={cn(
                                'relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full',
                                hasResults
                                  ? 'bg-warning/12 text-warning'
                                  : 'bg-base-content/6 text-base-content/55',
                              )}
                            >
                              {hasResults ? (
                                <BoltIcon className="size-4 shrink-0 transition-opacity duration-150 group-hover:opacity-0" />
                              ) : (
                                <ClockIcon className="size-4 shrink-0 transition-opacity duration-150 group-hover:opacity-0" />
                              )}
                              <span className="absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                <RunAvatar
                                  executedByName={run.executedByName}
                                  executedByAvatarUrl={run.executedByAvatarUrl}
                                  source={run.source}
                                  size="size-8"
                                />
                              </span>
                            </span>

                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <div className="flex items-center gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">
                                    {run.name}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-base-content/70">
                                    {project && (
                                      <span className="font-medium text-base-content/85">
                                        {project.name}
                                      </span>
                                    )}
                                    {' · '}
                                    {run.environment}
                                    {' · '}
                                    {formatDateTime(run.createdAt)}
                                  </p>
                                </div>

                                <span className="inline-flex shrink-0 animate-pulse items-center rounded-full border border-warning/22 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-warning uppercase">
                                  Live
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5">
                                {hasResults ? (
                                  <>
                                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-warning/15">
                                      <div
                                        className="h-full rounded-full bg-warning transition-all"
                                        style={{ width: `${passRate}%` }}
                                      />
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                      {passed > 0 && (
                                        <span className="flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 font-mono text-xs font-semibold text-success tabular-nums">
                                          {passed}
                                          <CheckCircleIcon className="size-3" />
                                        </span>
                                      )}
                                      {failed > 0 && (
                                        <span className="flex items-center gap-1 rounded-md bg-error/10 px-2 py-0.5 font-mono text-xs font-semibold text-error tabular-nums">
                                          {failed}
                                          <XCircleIcon className="size-3" />
                                        </span>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-[11px] text-base-content/55">
                                    Waiting for results…
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-base-content/65 uppercase">
                  Recently Completed
                  {recentlyCompletedRuns.length > 0 && (
                    <span className="rounded-full bg-base-content/8 px-1.5 py-0.5 font-mono text-[10px] font-bold text-base-content/70 tabular-nums">
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
                            className="group flex items-center gap-3 px-4 py-2 transition-[background-color,box-shadow] duration-150 hover:bg-base-300 hover:shadow-[inset_3px_0_0_var(--color-primary)]"
                          >
                            <span
                              className={cn(
                                'relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full',
                                hasFailed
                                  ? 'bg-error/12 text-error'
                                  : 'bg-success/12 text-success',
                              )}
                            >
                              {hasFailed ? (
                                <XCircleIcon className="size-5 shrink-0 transition-opacity duration-150 group-hover:opacity-0" />
                              ) : (
                                <CheckCircleIcon className="size-5 shrink-0 transition-opacity duration-150 group-hover:opacity-0" />
                              )}
                              <span className="absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                <RunAvatar
                                  executedByName={run.executedByName}
                                  executedByAvatarUrl={run.executedByAvatarUrl}
                                  source={run.source}
                                  size="size-8"
                                />
                              </span>
                            </span>

                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <div className="flex items-center gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">
                                    {run.name}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-base-content/70">
                                    {project && (
                                      <span className="font-medium text-base-content/85">
                                        {project.name}
                                      </span>
                                    )}
                                    {' · '}
                                    {run.environment}
                                    {' · '}
                                    {formatDateTime(
                                      run.updatedAt ?? run.createdAt,
                                    )}
                                  </p>
                                </div>

                                {passRate !== null && (
                                  <span
                                    className={cn(
                                      'flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 font-mono text-sm tabular-nums',
                                      passRate === 100 &&
                                        'bg-success/10 text-success',
                                      passRate !== null &&
                                        passRate < 100 &&
                                        passRate >= 80 &&
                                        'bg-warning/10 text-warning',
                                      passRate !== null &&
                                        passRate < 80 &&
                                        'bg-error/10 text-error',
                                    )}
                                  >
                                    {hasFailed ? (
                                      <XCircleIcon className="size-3" />
                                    ) : (
                                      <CheckCircleIcon className="size-3" />
                                    )}
                                    {passRate}%
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5">
                                {summary && total > 0 ? (
                                  <>
                                    <div
                                      className={cn(
                                        'h-1.5 min-w-0 flex-1 overflow-hidden rounded-full transition-all',
                                        hasFailed
                                          ? 'bg-error/20'
                                          : 'bg-success/20',
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          'h-full rounded-full transition-all',
                                          hasFailed ? 'bg-error' : 'bg-success',
                                        )}
                                        style={{ width: `${passRate ?? 0}%` }}
                                      />
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                      {passed > 0 && (
                                        <span className="flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 font-mono text-xs text-success tabular-nums">
                                          {passed}
                                          <CheckCircleIcon className="size-3" />
                                        </span>
                                      )}
                                      {(summary.failed ?? 0) > 0 && (
                                        <span className="flex items-center gap-1 rounded-md bg-error/10 px-2 py-0.5 font-mono text-xs text-error tabular-nums">
                                          {summary.failed}
                                          <XCircleIcon className="size-3" />
                                        </span>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-[11px] text-base-content/55">
                                    No results logged
                                  </span>
                                )}
                              </div>
                            </div>
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
