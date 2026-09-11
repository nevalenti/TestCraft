import { DefectType } from '@testcraft/types';

import { StatusPill } from '@/components/ui/StatusPill';

const config: Record<DefectType, { label: string; cls: string }> = {
  [DefectType.ProductBug]: {
    label: 'Product Bug',
    cls: 'bg-error/12 text-error border-error/25',
  },
  [DefectType.AutomationBug]: {
    label: 'Automation Bug',
    cls: 'bg-warning/12 text-warning border-warning/25',
  },
  [DefectType.EnvironmentIssue]: {
    label: 'Environment Issue',
    cls: 'bg-info/12 text-info border-info/25',
  },
  [DefectType.ToInvestigate]: {
    label: 'To Investigate',
    cls: 'bg-base-content/6 text-base-content/75 border-base-content/15',
  },
};

export const DefectTypeBadge = ({ type }: { type: DefectType }) => {
  const { label, cls } = config[type];

  return <StatusPill label={label} className={cls} />;
};
