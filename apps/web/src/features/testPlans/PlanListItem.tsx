import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';
import type { TestPlan } from '@testcraft/types';

import { formatDate } from '@/lib/format';

export const PlanListItem = ({
  plan,
  projectId,
  onEdit,
  onDelete,
}: {
  plan: TestPlan;
  projectId: string;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <li className="flex items-center justify-between gap-4 rounded-xl border border-border bg-base-100 px-4 py-2.5 transition-colors hover:bg-base-200/40">
    <div className="min-w-0">
      <Link
        to="/projects/$projectId/plans/$planId"
        params={{ projectId, planId: plan.id }}
        className="text-sm font-semibold hover:text-primary"
      >
        {plan.name}
      </Link>
      {plan.description && (
        <p className="mt-0.5 truncate text-xs text-base-content/75">
          {plan.description}
        </p>
      )}
      <p className="mt-1 text-xs text-base-content/65">
        Created {formatDate(plan.createdAt)} · {plan.caseCount ?? 0} case
        {plan.caseCount === 1 ? '' : 's'}
      </p>
    </div>
    <div className="flex items-center gap-1.5">
      <button
        className="btn btn-ghost btn-xs"
        onClick={onEdit}
        aria-label="Edit plan"
      >
        <PencilIcon className="size-3.5" />
      </button>
      <button
        className="btn text-error btn-ghost btn-xs"
        onClick={onDelete}
        aria-label="Delete plan"
      >
        <TrashIcon className="size-3.5" />
      </button>
    </div>
  </li>
);
