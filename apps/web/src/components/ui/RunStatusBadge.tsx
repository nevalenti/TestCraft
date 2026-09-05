import { TestRunStatus } from '@testcraft/types';

import { StatusPill } from '@/components/ui/StatusPill';

const RUN_STATUS_STYLES: Record<TestRunStatus, string> = {
  [TestRunStatus.Active]: 'bg-warning/10 text-warning border-warning/22',
  [TestRunStatus.Completed]: 'bg-success/10 text-success border-success/22',
  [TestRunStatus.Archived]:
    'bg-base-content/5 text-base-content/70 border-base-content/12',
};

export const RunStatusBadge = ({ status }: { status: TestRunStatus }) => (
  <StatusPill label={status} className={RUN_STATUS_STYLES[status]} uppercase />
);
