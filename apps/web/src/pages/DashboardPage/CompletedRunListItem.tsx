import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';
import type { Project, TestRun, TestRunSummary } from '@testcraft/types';

import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import {
  RunAvatarBubble,
  RunMiniBadges,
  RunProgressBar,
} from '@/pages/DashboardPage/RunListItemParts';

interface CompletedRunListItemProps {
  run: TestRun;
  project: Project | undefined;
  summary: TestRunSummary | undefined;
}

export const CompletedRunListItem = ({
  run,
  project,
  summary,
}: CompletedRunListItemProps) => {
  const total = summary?.total ?? 0;
  const passed = summary?.passed ?? 0;
  const failed = summary?.failed ?? 0;
  const hasFailed = failed > 0;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : null;

  return (
    <li>
      <Link
        to="/projects/$projectId/runs/$runId"
        params={{ projectId: run.projectId, runId: run.id }}
        className="group flex items-center gap-3 px-4 py-2 transition-[background-color,box-shadow] duration-150 hover:bg-base-300 hover:shadow-[inset_3px_0_0_var(--color-primary)]"
      >
        <RunAvatarBubble
          wrapperClass={
            hasFailed ? 'bg-error/12 text-error' : 'bg-success/12 text-success'
          }
          icon={
            hasFailed ? (
              <XCircleIcon className="size-5 shrink-0 transition-opacity duration-150 group-hover:opacity-0" />
            ) : (
              <CheckCircleIcon className="size-5 shrink-0 transition-opacity duration-150 group-hover:opacity-0" />
            )
          }
          executedByName={run.executedByName}
          executedByAvatarUrl={run.executedByAvatarUrl}
          source={run.source}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{run.name}</p>
              <p className="mt-0.5 truncate text-xs text-base-content/70">
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

            {passRate !== null && (
              <span
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 font-mono text-sm tabular-nums',
                  passRate === 100 && 'bg-success/10 text-success',
                  passRate < 100 &&
                    passRate >= 80 &&
                    'bg-warning/10 text-warning',
                  passRate < 80 && 'bg-error/10 text-error',
                )}
              >
                {hasFailed ? (
                  <XCircleIcon className="size-3" />
                ) : (
                  <CheckCircleIcon className="size-3" />
                )}
                {passRate}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {total > 0 ? (
              <>
                <RunProgressBar
                  trackClass={hasFailed ? 'bg-error/20' : 'bg-success/20'}
                  fillClass={hasFailed ? 'bg-error' : 'bg-success'}
                  widthPercent={passRate ?? 0}
                />
                <RunMiniBadges passed={passed} failed={failed} />
              </>
            ) : (
              <span className="text-[11px] text-base-content/55">
                No results logged
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
};
