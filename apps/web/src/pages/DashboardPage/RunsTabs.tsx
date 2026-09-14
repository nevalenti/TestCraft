import { BoltIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

import { cn } from '@/lib/cn';

export type RunsTab = 'active' | 'completed';

export const RunsTabs = ({
  tab,
  onChange,
  activeCount,
  completedCount,
}: {
  tab: RunsTab;
  onChange: (tab: RunsTab) => void;
  activeCount: number;
  completedCount: number;
}) => (
  <div className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-2xl border border-border bg-base-100 p-1">
    <button
      type="button"
      onClick={() => onChange('active')}
      aria-pressed={tab === 'active'}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold whitespace-nowrap transition-colors',
        tab === 'active'
          ? 'bg-warning/14 text-warning'
          : 'text-base-content/60 hover:bg-base-content/6 hover:text-base-content',
      )}
    >
      <BoltIcon className="size-4" />
      Test Runs
      <span
        className={cn(
          'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums',
          tab === 'active' ? 'bg-warning/22' : 'bg-base-content/9',
        )}
      >
        {activeCount}
      </span>
    </button>
    <button
      type="button"
      onClick={() => onChange('completed')}
      aria-pressed={tab === 'completed'}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold whitespace-nowrap transition-colors',
        tab === 'completed'
          ? 'bg-success/14 text-success'
          : 'text-base-content/60 hover:bg-base-content/6 hover:text-base-content',
      )}
    >
      <CheckCircleIcon className="size-4" />
      Recently Completed
      <span
        className={cn(
          'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums',
          tab === 'completed' ? 'bg-success/22' : 'bg-base-content/9',
        )}
      >
        {completedCount}
      </span>
    </button>
  </div>
);
