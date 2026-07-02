import { TestRunStatus } from "@testcraft/types";

import { cn } from "@/lib/cn";

const RUN_STATUS_STYLES: Record<TestRunStatus, string> = {
  [TestRunStatus.Active]: "bg-warning/10 text-warning border-warning/22",
  [TestRunStatus.Completed]: "bg-success/10 text-success border-success/22",
  [TestRunStatus.Archived]:
    "bg-base-content/5 text-base-content/65 border-base-content/12",
};

export const RunStatusBadge = ({ status }: { status: TestRunStatus }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
      RUN_STATUS_STYLES[status],
    )}
  >
    {status}
  </span>
);
