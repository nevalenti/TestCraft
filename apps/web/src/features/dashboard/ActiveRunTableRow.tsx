import { BoltIcon, ClockIcon } from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';
import type { Project, TestRun, TestRunSummary } from '@testcraft/types';

import { MetaPill } from '@/components/ui/MetaPill';
import { formatCiRunName } from '@/features/dashboard/format';
import {
  ProgressBarSkeleton,
  ResultsBadgesSkeleton,
  RunAvatarBubble,
  RunMiniBadges,
  RunResultsBar,
} from '@/features/testRuns/RunListItemParts';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { formatElapsed } from '@/lib/format';

interface ActiveRunTableRowProps {
  run: TestRun;
  project: Project | undefined;
  summary: TestRunSummary | undefined;
}

export const ActiveRunTableRow = ({
  run,
  project,
  summary,
}: ActiveRunTableRowProps) => {
  const total = summary?.total ?? 0;
  const passed = summary?.passed ?? 0;
  const failed = summary?.failed ?? 0;
  const hasResults = total > 0;
  const isSummaryLoading = summary === undefined;
  const isSummarySkeletonVisible = useIsLoadingVisible(isSummaryLoading);

  let resultContent: React.ReactNode = null;
  if (isSummaryLoading) {
    if (isSummarySkeletonVisible) {
      resultContent = (
        <div className="flex items-center gap-2.5">
          <ProgressBarSkeleton />
          <ResultsBadgesSkeleton />
        </div>
      );
    }
  } else if (hasResults) {
    resultContent = (
      <div className="flex items-center gap-2.5">
        <div className="max-w-28 min-w-16 flex-1">
          <RunResultsBar passed={passed} failed={failed} />
        </div>
        <RunMiniBadges passed={passed} failed={failed} emphasize />
      </div>
    );
  } else {
    resultContent = (
      <span className="text-xs whitespace-nowrap text-base-content/55">
        Waiting for results…
      </span>
    );
  }

  return (
    <tr
      data-testid="active-run-row"
      className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
    >
      <td>
        <Link
          to="/projects/$projectId/runs/$runId"
          params={{ projectId: run.projectId, runId: run.id }}
          className="flex min-w-56 items-center gap-2.5"
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
          <span className="flex min-w-0 flex-col">
            <span
              className="truncate text-sm font-semibold group-hover:underline"
              title={run.name}
            >
              {formatCiRunName(run.name)}
            </span>
            <span className="truncate text-xs text-base-content/55">
              {run.environment}
              {run.source && ` · ${run.source}`}
            </span>
          </span>
        </Link>
      </td>
      <td>
        {project ? (
          <Link
            to="/projects/$projectId/runs"
            params={{ projectId: project.id }}
            className="inline-flex"
          >
            <MetaPill className="transition-colors hover:text-base-content">
              {project.name}
            </MetaPill>
          </Link>
        ) : (
          <span className="text-xs text-base-content/40">—</span>
        )}
      </td>
      <td>{resultContent}</td>
      <td className="text-xs whitespace-nowrap text-base-content/65 tabular-nums">
        {formatElapsed(run.createdAt)} ago
      </td>
    </tr>
  );
};
