import {
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  FolderIcon,
} from '@heroicons/react/24/solid';
import { useQueries } from '@tanstack/react-query';
import { TestRunStatus } from '@testcraft/types';
import { compareDesc } from 'date-fns';
import { useMemo } from 'react';

import { testRunQueries } from '@/api/testRuns';
import keycloak from '@/auth/keycloak';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useProjects } from '@/hooks/useProjects';
import { ActiveRunListItem } from '@/pages/DashboardPage/ActiveRunListItem';
import { CompletedRunListItem } from '@/pages/DashboardPage/CompletedRunListItem';
import { StatCard } from '@/pages/DashboardPage/StatCard';

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
        refetchIntervalInBackground: false,
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
                    {activeRuns.map((run, index) => (
                      <ActiveRunListItem
                        key={run.id}
                        run={run}
                        project={projectMap.get(run.projectId)}
                        summary={activeRunSummaries.get(run.id)}
                        shineDelay={index < 5 ? index * 0.5 : undefined}
                      />
                    ))}
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
                    {recentlyCompletedRuns.map((run) => (
                      <CompletedRunListItem
                        key={run.id}
                        run={run}
                        project={projectMap.get(run.projectId)}
                        summary={completedRunSummaries.get(run.id)}
                      />
                    ))}
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
