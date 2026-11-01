import { Link } from "@tanstack/react-router";
import type { TestPlan } from "@testcraft/types";

import { RelativeTime } from "@/components/ui/RelativeTime";
import { ResourceActions } from "@/components/ui/resource/ResourceActions";

interface PlanTableRowProps {
  plan: TestPlan;
  projectId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showDescription?: boolean;
}

export const PlanTableRow = ({
  plan,
  projectId,
  onEdit,
  onDelete,
  showDescription = true,
}: PlanTableRowProps) => (
  <tr
    data-testid="plan-row"
    className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
  >
    <td>
      <Link
        to="/projects/$projectId/plans/$planId"
        params={{ projectId, planId: plan.id }}
        className="flex min-w-56 items-center"
      >
        <span
          className="min-w-0 truncate text-sm font-semibold group-hover:underline"
          title={plan.name}
        >
          {plan.name}
        </span>
      </Link>
    </td>
    {showDescription && (
      <td data-mobile-hide className="max-w-xs truncate text-xs text-fg-muted">
        {plan.description || (
          <span data-empty className="text-fg-subtle">
            —
          </span>
        )}
      </td>
    )}
    <td className="text-xs whitespace-nowrap text-fg-muted">
      {plan.case_count ?? 0} case{plan.case_count === 1 ? "" : "s"}
    </td>
    <td className="text-xs text-fg-muted">
      <RelativeTime value={plan.created_at} />
    </td>
    <td>
      <div
        data-actions
        className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
      >
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
