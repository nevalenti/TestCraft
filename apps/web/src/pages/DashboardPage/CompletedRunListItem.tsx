import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';
import type { Project, TestRun, TestRunSummary } from '@testcraft/types';

import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import {
  RunAvatarBubble,
  RunMiniBadges,
  RunProgressBar,
  RunSummarySkeleton,
} from '@/pages/DashboardPage/RunListItemParts';

interface CompletedRunListItemProps {
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
  isLoading: boolean,
  isSkeletonVisible: boolean,
  passRate: number | null,
  hasFailed: boolean,
): React.ReactNode => {
  if (isLoading) {
    return isSkeletonVisible ? (
      <div className="h-6 w-14 shrink-0 rounded-md bg-base-content/10 motion-safe:animate-pulse" />
    ) : null;
  }
  if (passRate === null) return null;

  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-sm tabular-nums',
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

const getSummaryContent = (
  isLoading: boolean,
  isSkeletonVisible: boolean,
  total: number,
  hasFailed: boolean,
  passRate: number | null,
  passed: number,
  failed: number,
): React.ReactNode => {
  if (isLoading) return isSkeletonVisible ? <RunSummarySkeleton /> : null;

  if (total > 0) {
    return (
      <>
        <RunProgressBar
          trackClass={hasFailed ? 'bg-error/20' : 'bg-success/20'}
          fillClass={hasFailed ? 'bg-error' : 'bg-success'}
          widthPercent={passRate ?? 0}
        />
        <RunMiniBadges passed={passed} failed={failed} />
      </>
    );
  }

  return (
    <span className="text-[11px] text-base-content/55">No results logged</span>
  );
};

export const CompletedRunListItem = ({
  run,
  project,
  summary,
}: CompletedRunListItemProps) => {
  const isLoading = summary === undefined;
  const isSkeletonVisible = useIsLoadingVisible(isLoading);
  const total = summary?.total ?? 0;
  const passed = summary?.passed ?? 0;
  const failed = summary?.failed ?? 0;
  const hasFailed = failed > 0;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : null;

  const avatarBadge = getAvatarBadge(isLoading, hasFailed);
  const passRateBadge = getPassRateBadge(
    isLoading,
    isSkeletonVisible,
    passRate,
    hasFailed,
  );
  const summaryContent = getSummaryContent(
    isLoading,
    isSkeletonVisible,
    total,
    hasFailed,
    passRate,
    passed,
    failed,
  );

  return (
    <li>
      <Link
        to="/projects/$projectId/runs/$runId"
        params={{ projectId: run.projectId, runId: run.id }}
        className={cn(
          'flex items-center gap-3 px-4 py-2 transition-[background-color,box-shadow] duration-150 hover:bg-base-300',
          hasFailed
            ? 'hover:shadow-[inset_3px_0_0_var(--color-error)]'
            : 'hover:shadow-[inset_3px_0_0_var(--color-success)]',
        )}
      >
        <RunAvatarBubble
          badgeClass={avatarBadge.className}
          badgeIcon={avatarBadge.icon}
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
                {formatDateTime(run.updatedAt ?? run.createdAt)}
              </p>
            </div>

            {passRateBadge}
          </div>

          <div className="flex items-center gap-2.5">{summaryContent}</div>
        </div>
      </Link>
    </li>
  );
};
