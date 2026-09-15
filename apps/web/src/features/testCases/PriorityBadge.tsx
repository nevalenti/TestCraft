import { TestCasePriority } from '@testcraft/types';

import { StatusPill } from '@/components/ui/StatusPill';

const config: Record<TestCasePriority, { label: string; cls: string }> = {
  [TestCasePriority.Low]: {
    label: 'Low',
    cls: 'bg-base-content/6 text-base-content/75 border-base-content/15',
  },
  [TestCasePriority.Medium]: {
    label: 'Medium',
    cls: 'bg-info/12 text-info border-info/25',
  },
  [TestCasePriority.High]: {
    label: 'High',
    cls: 'bg-warning/12 text-warning border-warning/25',
  },
  [TestCasePriority.Critical]: {
    label: 'Critical',
    cls: 'bg-error/12 text-error border-error/25',
  },
};

export const PriorityBadge = ({
  priority,
}: {
  priority: TestCasePriority | undefined;
}) => {
  const item = priority === undefined ? undefined : config[priority];

  if (!item) return null;

  return <StatusPill label={item.label} className={item.cls} />;
};
