import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';
import type { TestPlan } from '@testcraft/types';

import { ResourceActions } from '@/components/ui/ResourceActions';
import { formatDate } from '@/lib/format';

interface TestPlanTableRowProps {
  plan: TestPlan;
  projectId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const TestPlanTableRow = ({
  plan,
  projectId,
  onEdit,
  onDelete,
}: TestPlanTableRowProps) => (
  <tr
    data-testid="plan-row"
    className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
  >
    <td>
      <Link
        to="/projects/$projectId/plans/$planId"
        params={{ projectId, planId: plan.id }}
        className="flex min-w-56 items-center gap-2.5"
      >
        <span className="card-bg-primary flex size-7 shrink-0 items-center justify-center rounded-lg border text-primary">
          <ClipboardDocumentCheckIcon className="size-3.5" />
        </span>
        <span
          className="min-w-0 truncate text-sm font-semibold group-hover:underline"
          title={plan.name}
        >
          {plan.name}
        </span>
      </Link>
    </td>
    <td className="max-w-xs truncate text-xs text-base-content/70">
      {plan.description ?? (
        <span className="text-base-content/55 italic">No description</span>
      )}
    </td>
    <td className="text-xs whitespace-nowrap text-base-content/70">
      {plan.caseCount ?? 0} case{plan.caseCount === 1 ? '' : 's'}
    </td>
    <td className="text-xs whitespace-nowrap text-base-content/65 tabular-nums">
      {formatDate(plan.createdAt)}
    </td>
    <td>
      <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <ResourceActions
          onEdit={onEdit}
          onDelete={onDelete}
          label="plan"
          size="xs"
        />
      </div>
    </td>
  </tr>
);
