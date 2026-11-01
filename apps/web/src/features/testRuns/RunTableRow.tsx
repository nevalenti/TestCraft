import {
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import type { TestRun, TestRunSummary } from "@testcraft/types";
import { TestRunStatus } from "@testcraft/types";

import { MetaPill } from "@/components/ui/MetaPill";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { ResourceActions } from "@/components/ui/resource/ResourceActions";
import { RunAvatarBubble } from "@/features/testRuns/RunAvatarBubble";
import {
  ResultsBadgesSkeleton,
  RunMiniBadges,
} from "@/features/testRuns/RunMiniBadges";
import { RunStatusBadge } from "@/features/testRuns/RunStatusBadge";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";

const getAvatarBadge = (
  status: TestRunStatus,
  isLoading: boolean,
  hasFailed: boolean,
) => {
  if (status === TestRunStatus.Active) {
    return {
      className: "bg-warning/15 text-warning",
      icon: <BoltIcon className="size-4" />,
    };
  }
  if (status === TestRunStatus.Archived || isLoading) {
    return {
      className: "bg-base-content/8 text-fg-muted",
      icon: <ClockIcon className="size-4" />,
    };
  }
  if (hasFailed) {
    return {
      className: "bg-error/15 text-error",
      icon: <XCircleIcon className="size-4" />,
    };
  }
  return {
    className: "bg-success/15 text-success",
    icon: <CheckCircleIcon className="size-4" />,
  };
};

interface RunTableRowProps {
  run: TestRun;
  summary: TestRunSummary | undefined;
  projectId: string;
  onEdit?: () => void;
  onDelete?: () => void;
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
    <span data-empty className="text-xs text-fg-subtle">
      —
    </span>
  );
  if (isCompleted) {
    if (isLoading) {
      resultsContent = isSkeletonVisible ? <ResultsBadgesSkeleton /> : null;
    } else if (total > 0) {
      resultsContent = <RunMiniBadges passed={passed} failed={failed} />;
    } else {
      resultsContent = (
        <span className="text-xs text-fg-subtle">No results</span>
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
          to="/projects/$projectId/runs/$runId"
          params={{ projectId, runId: run.id }}
          aria-label="Open test run"
          className="flex min-w-56 items-center gap-2.5"
        >
          <RunAvatarBubble
            badgeClass={avatarBadge.className}
            badgeIcon={avatarBadge.icon}
            executedByName={run.executed_by_name}
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
      <td className="text-xs whitespace-nowrap text-fg-muted">
        {run.environment}
      </td>
      <td>
        {run.source ? (
          <MetaPill>{run.source}</MetaPill>
        ) : (
          <span data-empty className="text-xs text-fg-subtle">
            —
          </span>
        )}
      </td>
      <td>
        <RunStatusBadge status={run.status} />
      </td>
      <td>{resultsContent}</td>
      <td className="text-xs text-fg-muted">
        <RelativeTime value={run.created_at} />
      </td>
      <td>
        <div
          data-actions
          className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
        >
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
