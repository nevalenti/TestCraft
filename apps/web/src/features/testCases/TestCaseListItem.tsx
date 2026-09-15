import { ClipboardDocumentListIcon } from '@heroicons/react/24/solid';
import type { TestCase } from '@testcraft/types';

import { LabelBadge } from '@/components/ui/LabelBadge';
import { ResourceListItem } from '@/components/ui/ResourceListItem';
import { PriorityBadge } from '@/features/testCases/PriorityBadge';
import { formatDate } from '@/lib/format';

export const TestCaseListItem = ({
  testCase,
  projectId,
  suiteId,
  onEdit,
  onDelete,
}: {
  testCase: TestCase;
  projectId: string;
  suiteId: string;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <ResourceListItem
    testId="case-card"
    onEdit={onEdit}
    onDelete={onDelete}
    to={`/projects/${projectId}/suites/${suiteId}/cases/${testCase.id}`}
    label="test case"
    cardBg="card-bg-info"
    accentText="text-info"
    typeIcon={<ClipboardDocumentListIcon className="size-4" />}
  >
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate text-sm font-semibold">{testCase.name}</span>
      <p className="truncate text-xs text-base-content/70">
        {testCase.description ?? (
          <span className="text-base-content/55 italic">No description</span>
        )}
      </p>
    </div>
    <div className="hidden shrink-0 items-center gap-2 sm:flex">
      {(testCase.labels ?? []).length > 0 && (
        <div className="flex items-center gap-1">
          {testCase.labels!.slice(0, 2).map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
          {testCase.labels!.length > 2 && (
            <span className="text-xs font-medium text-base-content/55">
              +{testCase.labels!.length - 2}
            </span>
          )}
        </div>
      )}
      {testCase.stepCount > 0 && (
        <span className="text-xs text-base-content/70">
          {testCase.stepCount} step{testCase.stepCount === 1 ? '' : 's'}
        </span>
      )}
      <PriorityBadge priority={testCase.priority} />
      <span className="text-xs text-base-content/55 tabular-nums">
        {formatDate(testCase.createdAt)}
      </span>
    </div>
  </ResourceListItem>
);
