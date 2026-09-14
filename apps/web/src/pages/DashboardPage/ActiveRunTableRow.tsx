import { BoltIcon, ClockIcon } from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';
import type { Project, TestRun, TestRunSummary } from '@testcraft/types';

import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { formatCiRunName, formatElapsed } from '@/lib/format';
import {
  ProgressBarSkeleton,
  ResultsBadgesSkeleton,
  RunAvatarBubble,
  RunMiniBadges,
  RunResultsBar,
} from '@/pages/DashboardPage/RunListItemParts';

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

  let progressContent: React.ReactNode = null;
  let resultsContent: React.ReactNode = null;
  if (isSummaryLoading) {
    if (isSummarySkeletonVisible) {
      progressContent = <ProgressBarSkeleton />;
      resultsContent = <ResultsBadgesSkeleton />;
    }
  } else if (hasResults) {
    progressContent = <RunResultsBar passed={passed} failed={failed} />;
    resultsContent = (
      <RunMiniBadges passed={passed} failed={failed} emphasize />
    );
  } else {
    progressContent = (
      <span className="text-xs whitespace-nowrap text-base-content/55">
        Waiting for results…
      </span>
    );
    resultsContent = <span className="text-xs text-base-content/40">—</span>;
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
          <span
            className="min-w-0 truncate text-sm font-semibold group-hover:underline"
            title={run.name}
          >
            {formatCiRunName(run.name)}
          </span>
        </Link>
      </td>
      <td className="text-sm font-semibold whitespace-nowrap text-base-content/85">
        {project?.name ?? '—'}
      </td>
      <td className="text-xs whitespace-nowrap text-base-content/70">
        {run.environment}
      </td>
      <td className="min-w-36">{progressContent}</td>
      <td>{resultsContent}</td>
      <td className="text-xs whitespace-nowrap text-base-content/65 tabular-nums">
        {formatElapsed(run.createdAt)} ago
      </td>
    </tr>
  );
};
