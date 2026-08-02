import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { RunAvatar } from '@/pages/DashboardPage/RunAvatar';

export const RunAvatarBubble = ({
  wrapperClass,
  icon,
  executedByName,
  executedByAvatarUrl,
  source,
}: {
  wrapperClass: string;
  icon: ReactNode;
  executedByName?: string | null;
  executedByAvatarUrl?: string | null;
  source?: string | null;
}) => (
  <span
    className={cn(
      'relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full',
      wrapperClass,
    )}
  >
    {icon}
    <span className="absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
      <RunAvatar
        executedByName={executedByName}
        executedByAvatarUrl={executedByAvatarUrl}
        source={source}
        size="size-8"
      />
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
          'flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 font-mono text-xs text-success tabular-nums',
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
          'flex items-center gap-1 rounded-md bg-error/10 px-2 py-0.5 font-mono text-xs text-error tabular-nums',
          emphasize && 'font-semibold',
        )}
      >
        {failed}
        <XCircleIcon className="size-3" />
      </span>
    )}
  </div>
);
