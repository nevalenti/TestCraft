import { TestRunStatus } from "@testcraft/types";

const RUN_STATUS_STYLES: Record<TestRunStatus, string> = {
  [TestRunStatus.Active]: "bg-warning/15 text-warning border-warning/30",
  [TestRunStatus.Completed]: "bg-success/15 text-success border-success/30",
  [TestRunStatus.Archived]:
    "bg-base-content/8 text-base-content/50 border-base-content/15",
};

export const RunStatusBadge = ({ status }: { status: TestRunStatus }) => (
  <span
    className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${RUN_STATUS_STYLES[status]}`}
  >
    {status}
  </span>
);
