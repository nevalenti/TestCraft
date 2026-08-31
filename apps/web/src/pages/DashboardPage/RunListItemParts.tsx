import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { RunAvatar } from '@/pages/DashboardPage/RunAvatar';

export const RunAvatarBubble = ({
  badgeClass,
  badgeIcon,
  executedByName,
  executedByAvatarUrl,
  source,
}: {
  badgeClass: string;
  badgeIcon: ReactNode;
  executedByName?: string | null;
  executedByAvatarUrl?: string | null;
  source?: string | null;
}) => (
  <span className="relative inline-flex size-8 shrink-0">
    <RunAvatar
      executedByName={executedByName}
      executedByAvatarUrl={executedByAvatarUrl}
      source={source}
      size="size-8"
      className="ring-1 ring-border"
    />
    <span
      className={cn(
        'absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full ring-2 ring-base-100',
        badgeClass,
      )}
    >
      {badgeIcon}
    </span>
  </span>
);

export const RunProgressBar = ({
  trackClass,
  fillClass,
  widthPercent,
}: {
  trackClass: string;
  fillClass: string;
  widthPercent: number;
}) => (
  <div
    className={cn(
      'h-1.5 min-w-0 flex-1 overflow-hidden rounded-full transition-all',
      trackClass,
    )}
  >
    <div
      className={cn('h-full rounded-full transition-all', fillClass)}
      style={{ width: `${widthPercent}%` }}
    />
  </div>
);

export const RunSummarySkeleton = () => (
  <div className="flex min-w-0 flex-1 items-center gap-2.5">
    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-base-content/10">
      <div className="h-full w-2/5 rounded-full bg-base-content/15 motion-safe:animate-pulse" />
    </div>
    <div className="h-5 w-14 shrink-0 rounded-md bg-base-content/10 motion-safe:animate-pulse" />
  </div>
);

export const RunMiniBadges = ({
  passed,
  failed,
  emphasize,
}: {
  passed: number;
  failed: number;
  emphasize?: boolean;
}) => (
  <div className="flex shrink-0 items-center gap-1.5">
    {passed > 0 && (
      <span
        className={cn(
          'flex items-center gap-1 rounded-md border border-success/20 bg-success/10 px-2 py-0.5 font-mono text-xs text-success tabular-nums',
          emphasize && 'font-semibold',
        )}
      >
        {passed}
        <CheckCircleIcon className="size-3" />
      </span>
    )}
    {failed > 0 && (
      <span
        className={cn(
          'flex items-center gap-1 rounded-md border border-error/20 bg-error/10 px-2 py-0.5 font-mono text-xs text-error tabular-nums',
          emphasize && 'font-semibold',
        )}
      >
        {failed}
        <XCircleIcon className="size-3" />
      </span>
    )}
  </div>
);
