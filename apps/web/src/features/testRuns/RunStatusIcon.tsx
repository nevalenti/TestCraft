import {
  CheckCircleIcon,
  PlayCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { TestRun, TestRunSummary } from '@testcraft/types';
import { TestRunStatus } from '@testcraft/types';

import { cn } from '@/lib/cn';

export const RunStatusIcon = ({
  run,
  summary,
  size,
}: {
  run: TestRun;
  summary: TestRunSummary | undefined;
  size: 'size-3.5' | 'size-4';
}) => {
  if (run.status !== TestRunStatus.Completed) {
    return <PlayCircleIcon className={size} />;
  }

  return (summary?.failed ?? 0) > 0 ? (
    <XCircleIcon className={cn(size, 'text-error')} />
  ) : (
    <CheckCircleIcon className={cn(size, 'text-success')} />
  );
};
