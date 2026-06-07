import {
  ArrowRightIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
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
import { formatDate } from "@/lib/format";
import { ActiveRunsSkeleton } from "@/pages/DashboardPage/ActiveRunsSkeleton";
import { StatCard } from "@/pages/DashboardPage/StatCard";

export const DashboardPage = () => {
  const { data: projects, isPending: projectsPending, isError } = useProjects();

  const projectMap = useMemo(
    () => new Map((projects ?? []).map((project) => [project.id, project])),
    [projects],
  );

  const { activeRuns, runsPending } = useQueries({
    queries: (projects ?? []).map((project) => testRunQueries.all(project.id)),
    combine: (results) => ({
      activeRuns: results
        .flatMap((result) => result.data?.items ?? [])
        .filter((run) => run.status === TestRunStatus.Active)
        .sort((itemA, itemB) =>
          compareDesc(new Date(itemA.createdAt), new Date(itemB.createdAt)),
        ),
      runsPending:
        results.length > 0 && results.some((result) => result.isPending),
    }),
  });

  useBreadcrumbs([{ label: "Dashboard", href: "/" }]);

  if (isError) return <ErrorState />;

  const totalSuites = (projects ?? []).reduce(
    (sum, project) => sum + (project.suiteCount ?? 0),
    0,
  );
  const isLoadingStats = projectsPending;
  const isLoadingRuns = projectsPending || runsPending;

  return (
    <div className="w-full flex flex-col min-h-0">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            Overview
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            Cross-project status at a glance
          </p>
        </div>
        <Link
          to="/projects"
          className="btn btn-soft btn-square btn-lg rounded-xl shadow-md"
          aria-label="Projects"
        >
          <FolderIcon className="size-6 text-primary" />
        </Link>
      </header>

      <section className="page-content flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
          <StatCard
            label="Projects"
            value={projects?.length ?? 0}
            icon={<FolderIcon className="size-5" />}
            isLoading={isLoadingStats}
            accent="text-primary"
          />
          <StatCard
            label="Active Runs"
            value={activeRuns.length}
            icon={<BoltIcon className="size-5" />}
            isLoading={isLoadingRuns}
            accent="text-warning"
          />
          <StatCard
            label="Test Suites"
            value={totalSuites}
            icon={<ClipboardDocumentListIcon className="size-5" />}
            isLoading={isLoadingStats}
            accent="text-info"
          />
        </div>

        <div className="flex flex-col">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-base-content/50 mb-3">
            Active Runs
          </h2>
          {isLoadingRuns ? (
            <ActiveRunsSkeleton />
          ) : activeRuns.length === 0 ? (
            <div className="rounded-lg border border-border bg-base-100 px-6 py-16 text-center">
              <p className="text-sm font-semibold text-base-content/60 mb-1">
                No active runs
              </p>
              <p className="text-xs text-base-content/40">
                Start a test run from any project to track results here.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-base-100 shadow-sm">
              <ul className="divide-y divide-border">
                {activeRuns.map((run) => {
                  const project = projectMap.get(run.projectId);
                  return (
                    <li key={run.id}>
                      <Link
                        to="/projects/$projectId/runs/$runId"
                        params={{ projectId: run.projectId, runId: run.id }}
                        className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-base-200/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <BoltIcon className="size-4 text-warning shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {run.name}
                            </p>
                            <p className="text-xs text-base-content/50 truncate">
                              {project && (
                                <span className="font-medium text-base-content/65">
                                  {project.name}
                                </span>
                              )}
                              {" · "}
                              {run.environment}
                              {" · "}
                              {formatDate(run.createdAt)}
                            </p>
                          </div>
                        </div>
                        <ArrowRightIcon className="size-4 text-base-content/30 shrink-0 motion-safe:group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
