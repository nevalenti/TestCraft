import {
  CheckCircleIcon,
  ClockIcon,
  ServerStackIcon,
  ShareIcon,
} from "@heroicons/react/24/solid";
import { type TestRun, TestRunStatus } from "@testcraft/types";

import { MetaPill } from "@/components/ui/MetaPill";
import { PageHeader } from "@/components/ui/PageHeader";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { RunStatusBadge } from "@/features/testRuns/RunStatusBadge";
import { type RunView, RunViewTabs } from "@/pages/run/RunViewTabs";

interface RunPageHeaderProps {
  run: TestRun | undefined;
  projectId: string;
  view: RunView;
  onViewChange: (view: RunView) => void;
  canEdit: boolean;
  onComplete: () => void;
  isCompleting: boolean;
  onShare: () => void;
}

export const RunPageHeader = ({
  run,
  projectId,
  view,
  onViewChange,
  canEdit,
  onComplete,
  isCompleting,
  onShare,
}: RunPageHeaderProps) => (
  <PageHeader
    title={run?.name ?? "…"}
    badge={run && <RunStatusBadge status={run.status} />}
    backTo={{
      to: "/projects/$projectId/runs",
      params: { projectId },
    }}
    backLabel="Test runs"
    meta={
      run && (
        <>
          <span className="flex items-center gap-1">
            <ServerStackIcon className="size-3.5" aria-hidden="true" />
            {run.environment}
          </span>
          {run.source && <MetaPill>{run.source}</MetaPill>}
          <span className="flex items-center gap-1">
            <ClockIcon className="size-3.5" aria-hidden="true" />
            Started <RelativeTime value={run.created_at} />
          </span>
          {run.executed_by_name && <span>by {run.executed_by_name}</span>}
        </>
      )
    }
    actions={
      <>
        <RunViewTabs view={view} onChange={onViewChange} />
        {canEdit && run?.status === TestRunStatus.Active && (
          <button
            type="button"
            className="btn gap-1.5 btn-outline btn-sm"
            onClick={onComplete}
            disabled={isCompleting}
          >
            <CheckCircleIcon className="size-4" aria-hidden="true" />
            Complete run
          </button>
        )}
        {canEdit && (
          <button
            className="btn btn-square btn-ghost btn-sm"
            onClick={onShare}
            aria-label="Share this run"
            title="Share this run"
          >
            <ShareIcon className="size-4" />
          </button>
        )}
      </>
    }
  />
);
