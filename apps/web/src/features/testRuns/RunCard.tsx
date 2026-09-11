import type { TestRun, TestRunSummary } from '@testcraft/types';

import { MetaPill } from '@/components/ui/MetaPill';
import { ResourceCard } from '@/components/ui/ResourceCard';
import { RunStatusBadge } from '@/components/ui/RunStatusBadge';
import { RunStatusIcon } from '@/features/testRuns/RunStatusIcon';
import { formatDate } from '@/lib/format';

export const RunCard = ({
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
  <ResourceCard
    testId="run-card"
    onEdit={onEdit}
    onDelete={onDelete}
    to={`/projects/${projectId}/runs/${run.id}`}
    label="test run"
    cardBg="card-bg-warning"
    accentText="text-warning"
    typeIcon={<RunStatusIcon run={run} summary={summary} size="size-3.5" />}
  >
    <div className="flex flex-col gap-1">
      <span className="line-clamp-2 text-base leading-snug font-semibold">
        {run.name}
      </span>
      <p className="text-sm font-medium text-base-content/70">
        {run.environment}
      </p>
    </div>
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        {run.source && <MetaPill>{run.source}</MetaPill>}
        <RunStatusBadge status={run.status} />
      </div>
      <span className="shrink-0 text-xs font-medium text-base-content/55 tabular-nums">
        {formatDate(run.createdAt)}
      </span>
    </div>
  </ResourceCard>
);
