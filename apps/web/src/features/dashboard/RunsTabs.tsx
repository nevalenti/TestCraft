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
  <div className="flex items-center gap-6 border-b border-border px-4">
    <button
      type="button"
      onClick={() => onChange('active')}
      aria-pressed={tab === 'active'}
      className={cn(
        'relative flex items-center gap-2 py-3 text-xs font-bold whitespace-nowrap transition-colors',
        tab === 'active'
          ? 'text-warning'
          : 'text-base-content/50 hover:text-base-content/75',
      )}
    >
      <BoltIcon className="size-3.5" />
      Active Runs
      <span className="opacity-70">{activeCount}</span>
      {tab === 'active' && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-warning" />
      )}
    </button>
    <button
      type="button"
      onClick={() => onChange('completed')}
      aria-pressed={tab === 'completed'}
      className={cn(
        'relative flex items-center gap-2 py-3 text-xs font-bold whitespace-nowrap transition-colors',
        tab === 'completed'
          ? 'text-success'
          : 'text-base-content/50 hover:text-base-content/75',
      )}
    >
      <CheckCircleIcon className="size-3.5" />
      Recently Completed
      <span className="opacity-70">{completedCount}</span>
      {tab === 'completed' && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-success" />
      )}
    </button>
  </div>
);
