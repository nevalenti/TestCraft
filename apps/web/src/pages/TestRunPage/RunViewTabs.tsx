import {
  CommandLineIcon,
  QueueListIcon,
  SignalIcon,
} from '@heroicons/react/24/solid';

import { cn } from '@/lib/cn';

export type RunView = 'table' | 'live' | 'logs';

export const RunViewTabs = ({
  view,
  onChange,
}: {
  view: RunView;
  onChange: (view: RunView) => void;
}) => (
  <div className="join">
    <button
      className={cn(
        'btn join-item gap-1.5 btn-sm',
        view === 'table' ? 'btn-neutral' : 'btn-ghost',
      )}
      onClick={() => onChange('table')}
      aria-label="Table view"
    >
      <QueueListIcon className="size-4" />
      Table
    </button>
    <button
      className={cn(
        'btn join-item gap-1.5 btn-sm',
        view === 'live' ? 'btn-neutral' : 'btn-ghost',
      )}
      onClick={() => onChange('live')}
      aria-label="Live log view"
    >
      <SignalIcon className="size-4" />
      Live
    </button>
    <button
      className={cn(
        'btn join-item gap-1.5 btn-sm',
        view === 'logs' ? 'btn-neutral' : 'btn-ghost',
      )}
      onClick={() => onChange('logs')}
      aria-label="Pipeline logs"
    >
      <CommandLineIcon className="size-4" />
      Logs
    </button>
  </div>
);
