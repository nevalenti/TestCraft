import { DefectType } from '@testcraft/types';

import { cn } from '@/lib/cn';

const config: Record<DefectType, { label: string; cls: string }> = {
  [DefectType.ProductBug]: { label: 'Product Bug', cls: 'badge-error' },
  [DefectType.AutomationBug]: { label: 'Automation Bug', cls: 'badge-warning' },
  [DefectType.EnvironmentIssue]: {
    label: 'Environment Issue',
    cls: 'badge-info',
  },
  [DefectType.ToInvestigate]: { label: 'To Investigate', cls: 'badge-neutral' },
};

export function DefectTypeBadge({ type }: { type: DefectType }) {
  const { label, cls } = config[type];

  return <span className={cn('badge badge-sm font-medium', cls)}>{label}</span>;
}
