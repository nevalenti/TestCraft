import { ClipboardDocumentListIcon } from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';
import type { TestCase } from '@testcraft/types';

import { LabelBadge } from '@/components/ui/LabelBadge';
import { ResourceActions } from '@/components/ui/ResourceActions';
import { PriorityBadge } from '@/features/testCases/PriorityBadge';
import { formatDate } from '@/lib/format';

interface TestCaseTableRowProps {
  testCase: TestCase;
  projectId: string;
  suiteId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const TestCaseTableRow = ({
  testCase,
  projectId,
  suiteId,
  onEdit,
  onDelete,
}: TestCaseTableRowProps) => {
  const labels = testCase.labels ?? [];
  const stepSuffix = testCase.stepCount === 1 ? '' : 's';
  const stepsLabel =
    testCase.stepCount > 0 ? `${testCase.stepCount} step${stepSuffix}` : '—';

  return (
    <tr
      data-testid="case-card"
      className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
    >
      <td>
        <Link
          to={`/projects/${projectId}/suites/${suiteId}/cases/${testCase.id}`}
          aria-label="Open test case"
          className="flex min-w-56 items-center gap-2.5"
        >
          <span className="card-bg-primary flex size-7 shrink-0 items-center justify-center rounded-lg border text-primary">
            <ClipboardDocumentListIcon className="size-3.5" />
          </span>
          <span
            className="min-w-0 truncate text-sm font-semibold group-hover:underline"
            title={testCase.name}
          >
            {testCase.name}
          </span>
        </Link>
      </td>
      <td className="max-w-xs truncate text-xs text-base-content/70">
        {testCase.description ?? (
          <span className="text-base-content/55 italic">No description</span>
        )}
      </td>
      <td>
        {labels.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {labels.slice(0, 2).map((label) => (
              <LabelBadge key={label.id} label={label} />
            ))}
            {labels.length > 2 && (
              <span className="text-xs font-medium text-base-content/55">
                +{labels.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-base-content/40">—</span>
        )}
      </td>
      <td className="text-xs whitespace-nowrap text-base-content/70">
        {stepsLabel}
      </td>
      <td>
        <PriorityBadge priority={testCase.priority} />
      </td>
      <td className="text-xs whitespace-nowrap text-base-content/65 tabular-nums">
        {formatDate(testCase.createdAt)}
      </td>
      <td>
        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
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
