import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';
import type { Project, TestRun, TestRunSummary } from '@testcraft/types';

import { formatCiRunName } from '@/features/dashboard/format';
import {
  ProgressBarSkeleton,
  ResultsBadgesSkeleton,
  RunAvatarBubble,
  RunMiniBadges,
  RunResultsBar,
} from '@/features/dashboard/RunListItemParts';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

interface CompletedRunTableRowProps {
  run: TestRun;
  project: Project | undefined;
  summary: TestRunSummary | undefined;
}

const getAvatarBadge = (isLoading: boolean, hasFailed: boolean) => {
  if (isLoading) {
    return {
      className: 'bg-base-300 text-base-content/70',
      icon: <ClockIcon className="size-2.5" />,
    };
  }
  if (hasFailed) {
    return {
      className: 'bg-error text-error-content',
      icon: <XCircleIcon className="size-2.5" />,
    };
  }
  return {
    className: 'bg-success text-success-content',
    icon: <CheckCircleIcon className="size-2.5" />,
  };
};

const getPassRateBadge = (
  passRate: number | null,
  hasFailed: boolean,
): React.ReactNode => {
  if (passRate === null) return null;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-sm tabular-nums',
        passRate === 100 && 'border-success/20 bg-success/10 text-success',
        passRate < 100 &&
          passRate >= 80 &&
          'border-warning/20 bg-warning/10 text-warning',
        passRate < 80 && 'border-error/20 bg-error/10 text-error',
      )}
    >
      {hasFailed ? (
        <XCircleIcon className="size-3" />
      ) : (
        <CheckCircleIcon className="size-3" />
      )}
      {passRate}%
    </span>
  );
};

export const CompletedRunTableRow = ({
  run,
  project,
  summary,
}: CompletedRunTableRowProps) => {
  const isLoading = summary === undefined;
  const isSkeletonVisible = useIsLoadingVisible(isLoading);
  const total = summary?.total ?? 0;
  const passed = summary?.passed ?? 0;
  const failed = summary?.failed ?? 0;
  const hasFailed = failed > 0;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : null;

  const avatarBadge = getAvatarBadge(isLoading, hasFailed);
  const passRateBadge = getPassRateBadge(passRate, hasFailed);

  let progressContent: React.ReactNode = null;
  let resultsContent: React.ReactNode = null;
  if (isLoading) {
    if (isSkeletonVisible) {
      progressContent = <ProgressBarSkeleton />;
      resultsContent = <ResultsBadgesSkeleton />;
    }
  } else if (total > 0) {
    progressContent = <RunResultsBar passed={passed} failed={failed} />;
    resultsContent = <RunMiniBadges passed={passed} failed={failed} />;
  } else {
    progressContent = (
      <span className="text-xs text-base-content/55">No results logged</span>
    );
    resultsContent = <span className="text-xs text-base-content/40">—</span>;
  }

  return (
    <tr
      data-testid="completed-run-row"
      className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
    >
      <td>
        <Link
          to="/projects/$projectId/runs/$runId"
          params={{ projectId: run.projectId, runId: run.id }}
          className="flex min-w-56 items-center gap-2.5"
        >
          <RunAvatarBubble
            badgeClass={avatarBadge.className}
            badgeIcon={avatarBadge.icon}
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
      <td>
        {isLoading
          ? isSkeletonVisible && (
              <div className="h-6 w-14 rounded-md bg-base-content/10 motion-safe:animate-pulse" />
            )
          : passRateBadge}
      </td>
      <td className="text-xs whitespace-nowrap text-base-content/65 tabular-nums">
        {formatDateTime(run.updatedAt ?? run.createdAt)}
      </td>
    </tr>
  );
};
