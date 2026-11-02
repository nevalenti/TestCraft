import { Link } from "@tanstack/react-router";
import type { TestCase } from "@testcraft/types";

import { LabelBadge } from "@/components/ui/LabelBadge";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { ResourceActions } from "@/components/ui/resource/ResourceActions";
import { PriorityBadge } from "@/features/testCases/PriorityBadge";

interface CaseTableRowProps {
  testCase: TestCase;
  projectId: string;
  suiteId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showDescription?: boolean;
  showLabels?: boolean;
}

export const CaseTableRow = ({
  testCase,
  projectId,
  suiteId,
  onEdit,
  onDelete,
  showDescription = true,
  showLabels = true,
}: CaseTableRowProps) => {
  const labels = testCase.labels ?? [];
  const stepSuffix = testCase.step_count === 1 ? "" : "s";
  const stepsLabel =
    testCase.step_count > 0 ? `${testCase.step_count} step${stepSuffix}` : "—";

  return (
    <tr
      data-testid="case-card"
      className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
    >
      <td>
        <Link
          to="/projects/$projectId/suites/$suiteId/cases/$caseId"
          params={{ projectId, suiteId, caseId: testCase.id }}
          aria-label="Open test case"
          className="flex min-w-56 items-center"
        >
          <span
            className="min-w-0 truncate text-sm font-semibold group-hover:underline"
            title={testCase.name}
          >
            {testCase.name}
          </span>
        </Link>
      </td>
      {showDescription && (
        <td
          data-mobile-hide
          className="max-w-xs truncate text-xs text-fg-muted"
        >
          {testCase.description || (
            <span data-empty className="text-fg-subtle">
              —
            </span>
          )}
        </td>
      )}
      {showLabels && (
        <td>
          {labels.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1">
              {labels.slice(0, 2).map((label) => (
                <LabelBadge key={label.id} label={label} />
              ))}
              {labels.length > 2 && (
                <span className="text-xs font-medium text-fg-subtle">
                  +{labels.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span data-empty className="text-xs text-fg-subtle">
              —
            </span>
          )}
        </td>
      )}
      <td className="text-xs whitespace-nowrap text-fg-muted">{stepsLabel}</td>
      <td>
        <PriorityBadge priority={testCase.priority} />
      </td>
      <td className="text-xs text-fg-muted">
        <RelativeTime value={testCase.created_at} />
      </td>
      <td>
        <div
          data-actions
          className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
        >
          <ResourceActions
            onEdit={onEdit}
            onDelete={onDelete}
            label="test case"
            size="xs"
          />
        </div>
      </td>
    </tr>
  );
};
