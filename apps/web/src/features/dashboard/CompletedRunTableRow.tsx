import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import type { Project, TestRun, TestRunSummary } from "@testcraft/types";

import { MetaPill } from "@/components/ui/MetaPill";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { formatCiRunName } from "@/features/dashboard/format";
import { RunAvatarBubble } from "@/features/testRuns/RunAvatarBubble";
import {
  ResultsBadgesSkeleton,
  RunMiniBadges,
} from "@/features/testRuns/RunMiniBadges";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { cn } from "@/lib/cn";

interface CompletedRunTableRowProps {
  run: TestRun;
  project: Project | undefined;
  summary: TestRunSummary | undefined;
}

const getAvatarBadge = (isLoading: boolean, hasFailed: boolean) => {
  if (isLoading) {
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

const getPassRateBadge = (
  passRate: number | null,
  hasFailed: boolean,
): React.ReactNode => {
  if (passRate === null) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-sm tabular-nums",
        passRate === 100 && "border-success/20 bg-success/10 text-success",
        passRate < 100 &&
          passRate >= 80 &&
          "border-warning/20 bg-warning/10 text-warning",
        passRate < 80 && "border-error/20 bg-error/10 text-error",
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

  let resultContent: React.ReactNode = null;
  if (isLoading) {
    if (isSkeletonVisible) {
      resultContent = (
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-14 rounded-md bg-base-content/10 motion-safe:animate-pulse" />
          <ResultsBadgesSkeleton />
        </div>
      );
    }
  } else if (total > 0) {
    resultContent = (
      <div className="flex items-center gap-2.5">
        {passRateBadge}
        <RunMiniBadges passed={passed} failed={failed} />
      </div>
    );
  } else {
    resultContent = (
      <span className="text-xs text-fg-subtle">No results logged</span>
    );
  }

  return (
    <tr
      data-testid="completed-run-row"
      className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
    >
      <td>
        <Link
          to="/projects/$projectId/runs/$runId"
          params={{ projectId: run.project_id, runId: run.id }}
          className="flex min-w-56 items-center gap-2.5"
        >
          <RunAvatarBubble
            badgeClass={avatarBadge.className}
            badgeIcon={avatarBadge.icon}
            executedByName={run.executed_by_name}
            source={run.source}
          />
          <span className="flex min-w-0 flex-col">
            <span
              className="truncate text-sm font-semibold group-hover:underline"
              title={run.name}
            >
              {formatCiRunName(run.name)}
            </span>
            <span className="truncate text-xs text-fg-subtle">
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
          <span data-empty className="text-xs text-fg-subtle">
            —
          </span>
        )}
      </td>
      <td>{resultContent}</td>
      <td className="text-xs text-fg-muted">
        <RelativeTime value={run.updated_at ?? run.created_at} />
      </td>
    </tr>
  );
};
