import { BoltIcon, ClockIcon } from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';
import type { Project, TestRun, TestRunSummary } from '@testcraft/types';

import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { formatElapsed } from '@/lib/format';
import {
  RunAvatarBubble,
  RunMiniBadges,
  RunProgressBar,
  RunSummarySkeleton,
} from '@/pages/DashboardPage/RunListItemParts';

interface ActiveRunListItemProps {
  run: TestRun;
  project: Project | undefined;
  summary: TestRunSummary | undefined;
  shineDelay?: number;
}

export const ActiveRunListItem = ({
  run,
  project,
  summary,
  shineDelay,
}: ActiveRunListItemProps) => {
  const total = summary?.total ?? 0;
  const passed = summary?.passed ?? 0;
  const failed = summary?.failed ?? 0;
  const hasResults = total > 0;
  const passRate = hasResults ? Math.round((passed / total) * 100) : 0;

  const isSummarySkeletonVisible = useIsLoadingVisible(summary === undefined);

  let summaryContent: React.ReactNode;
  if (summary === undefined && isSummarySkeletonVisible) {
    summaryContent = <RunSummarySkeleton />;
  } else if (hasResults) {
    summaryContent = (
      <>
        <RunProgressBar
          trackClass="bg-warning/15"
          fillClass="bg-warning"
          widthPercent={passRate}
        />
        <RunMiniBadges passed={passed} failed={failed} emphasize />
      </>
    );
  } else {
    summaryContent = (
      <span className="text-[11px] text-base-content/55">
        Waiting for results…
      </span>
    );
  }

  return (
    <li className="relative overflow-hidden">
      {shineDelay !== undefined && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-base-content/[0.05] to-transparent"
          style={{ animation: `shine 4s ease-in-out ${shineDelay}s infinite` }}
        />
      )}
      <Link
        to="/projects/$projectId/runs/$runId"
        params={{ projectId: run.projectId, runId: run.id }}
        className="flex items-center gap-3 px-4 py-2 transition-[background-color,box-shadow] duration-150 hover:bg-base-300 hover:shadow-[inset_3px_0_0_var(--color-warning)]"
      >
        <RunAvatarBubble
          badgeClass={
            hasResults
              ? 'bg-warning text-warning-content'
              : 'bg-base-300 text-base-content/70'
          }
          badgeIcon={
            hasResults ? (
              <BoltIcon className="size-2.5" />
            ) : (
              <ClockIcon className="size-2.5" />
            )
          }
          executedByName={run.executedByName}
          executedByAvatarUrl={run.executedByAvatarUrl}
          source={run.source}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" title={run.name}>
                {run.name}
              </p>
              <p
                className="mt-0.5 truncate text-xs text-base-content/70"
                title={
                  project
                    ? `${project.name} · ${run.environment}`
                    : run.environment
                }
              >
                {project && (
                  <span className="font-medium text-base-content/85">
                    {project.name}
                  </span>
                )}
                {' · '}
                {run.environment}
                {' · '}
                Running for {formatElapsed(run.createdAt)}
              </p>
            </div>

            <span className="inline-flex shrink-0 animate-pulse items-center rounded-full border border-warning/22 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-warning uppercase">
              Live
            </span>
          </div>

          <div className="flex items-center gap-2.5">{summaryContent}</div>
        </div>
      </Link>
    </li>
  );
};
