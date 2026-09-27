import {
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';
import type { TestRun, TestRunSummary } from '@testcraft/types';
import { TestRunStatus } from '@testcraft/types';

import { MetaPill } from '@/components/ui/MetaPill';
import { ResourceActions } from '@/components/ui/ResourceActions';
import {
  ResultsBadgesSkeleton,
  RunAvatarBubble,
  RunMiniBadges,
} from '@/features/testRuns/RunListItemParts';
import { RunStatusBadge } from '@/features/testRuns/RunStatusBadge';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { formatDate } from '@/lib/format';

const getAvatarBadge = (
  status: TestRunStatus,
  isLoading: boolean,
  hasFailed: boolean,
) => {
  if (status === TestRunStatus.Active) {
    return {
      className: 'bg-warning text-warning-content',
      icon: <BoltIcon className="size-2.5" />,
    };
  }
  if (status === TestRunStatus.Archived || isLoading) {
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

interface RunTableRowProps {
  run: TestRun;
  summary: TestRunSummary | undefined;
  projectId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const RunTableRow = ({
  run,
  summary,
  projectId,
  onEdit,
  onDelete,
}: RunTableRowProps) => {
  const isCompleted = run.status === TestRunStatus.Completed;
  const isLoading = isCompleted && summary === undefined;
  const isSkeletonVisible = useIsLoadingVisible(isLoading);
  const total = summary?.total ?? 0;
  const passed = summary?.passed ?? 0;
  const failed = summary?.failed ?? 0;
  const hasFailed = failed > 0;

  const avatarBadge = getAvatarBadge(run.status, isLoading, hasFailed);

  let resultsContent: React.ReactNode = (
    <span className="text-xs text-base-content/40">—</span>
  );
  if (isCompleted) {
    if (isLoading) {
      resultsContent = isSkeletonVisible ? <ResultsBadgesSkeleton /> : null;
    } else if (total > 0) {
      resultsContent = <RunMiniBadges passed={passed} failed={failed} />;
    } else {
      resultsContent = (
        <span className="text-xs text-base-content/55">No results</span>
      );
    }
  }

  return (
    <tr
      data-testid="run-card"
      className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
    >
      <td>
        <Link
          to={`/projects/${projectId}/runs/${run.id}`}
          aria-label="Open test run"
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
            {run.name}
          </span>
        </Link>
      </td>
      <td className="text-xs whitespace-nowrap text-base-content/70">
        {run.environment}
      </td>
      <td>
        {run.source ? (
          <MetaPill>{run.source}</MetaPill>
        ) : (
          <span className="text-xs text-base-content/40">—</span>
        )}
      </td>
      <td>
        <RunStatusBadge status={run.status} />
      </td>
      <td>{resultsContent}</td>
      <td className="text-xs whitespace-nowrap text-base-content/65 tabular-nums">
        {formatDate(run.createdAt)}
      </td>
      <td>
        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <ResourceActions
            onEdit={onEdit}
            onDelete={onDelete}
            label="test run"
            size="xs"
          />
        </div>
      </td>
    </tr>
  );
};
