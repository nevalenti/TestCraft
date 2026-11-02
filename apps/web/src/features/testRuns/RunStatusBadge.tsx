import { TestRunStatus } from "@testcraft/types";

import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/cn";

const RUN_STATUS_STYLES: Record<TestRunStatus, string> = {
  [TestRunStatus.Active]: "bg-warning/10 text-warning border-warning/22",
  [TestRunStatus.Completed]: "bg-success/10 text-success border-success/22",
  [TestRunStatus.Archived]:
    "bg-base-content/5 text-fg-muted border-base-content/12",
};

const RUN_STATUS_LABELS: Record<TestRunStatus, string> = {
  [TestRunStatus.Active]: "Active",
  [TestRunStatus.Completed]: "Completed",
  [TestRunStatus.Archived]: "Archived",
};

export const RunStatusBadge = ({ status }: { status: TestRunStatus }) => (
  <StatusPill
    label={RUN_STATUS_LABELS[status]}
    className={RUN_STATUS_STYLES[status]}
    icon={
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full bg-current",
          status === TestRunStatus.Active && "motion-safe:animate-pulse",
        )}
      />
    }
  />
);
