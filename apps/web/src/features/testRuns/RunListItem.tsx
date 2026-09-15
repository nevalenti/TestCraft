import type { TestRun, TestRunSummary } from '@testcraft/types';

import { MetaPill } from '@/components/ui/MetaPill';
import { ResourceListItem } from '@/components/ui/ResourceListItem';
import { RunStatusBadge } from '@/features/testRuns/RunStatusBadge';
import { RunStatusIcon } from '@/features/testRuns/RunStatusIcon';
import { formatDate } from '@/lib/format';

export const RunListItem = ({
  run,
  summary,
  projectId,
  onEdit,
  onDelete,
}: {
  run: TestRun;
  summary: TestRunSummary | undefined;
  projectId: string;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <ResourceListItem
    testId="run-card"
    onEdit={onEdit}
    onDelete={onDelete}
    to={`/projects/${projectId}/runs/${run.id}`}
    label="test run"
    cardBg="card-bg-warning"
    accentText="text-warning"
    typeIcon={<RunStatusIcon run={run} summary={summary} size="size-4" />}
  >
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate text-sm font-semibold">{run.name}</span>
      <p className="truncate text-xs text-base-content/70">{run.environment}</p>
    </div>
    <div className="hidden shrink-0 items-center gap-2 sm:flex">
      {run.source && <MetaPill>{run.source}</MetaPill>}
      <RunStatusBadge status={run.status} />
      <span className="text-xs font-medium text-base-content/55 tabular-nums">
        {formatDate(run.createdAt)}
      </span>
    </div>
  </ResourceListItem>
);
