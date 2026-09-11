import { ClipboardDocumentListIcon } from '@heroicons/react/24/solid';
import type { TestCase } from '@testcraft/types';

import { LabelBadge } from '@/components/ui/LabelBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { ResourceCard } from '@/components/ui/ResourceCard';
import { formatDate } from '@/lib/format';

export const TestCaseCard = ({
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
  <ResourceCard
    testId="case-card"
    onEdit={onEdit}
    onDelete={onDelete}
    to={`/projects/${projectId}/suites/${suiteId}/cases/${testCase.id}`}
    label="test case"
    cardBg="card-bg-info"
    accentText="text-info"
    typeIcon={<ClipboardDocumentListIcon className="size-3.5" />}
  >
    <div className="flex flex-col gap-1">
      <span className="line-clamp-2 text-base leading-snug font-semibold">
        {testCase.name}
      </span>
      <p className="line-clamp-2 text-sm leading-relaxed text-base-content/70">
        {testCase.description ?? (
          <span className="text-base-content/55 italic">No description</span>
        )}
      </p>
    </div>
    {(testCase.labels ?? []).length > 0 && (
      <div className="flex flex-wrap items-center gap-1">
        {testCase.labels!.slice(0, 3).map((label) => (
          <LabelBadge key={label.id} label={label} />
        ))}
        {testCase.labels!.length > 3 && (
          <span className="text-xs font-medium text-base-content/55">
            +{testCase.labels!.length - 3}
          </span>
        )}
      </div>
    )}
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <PriorityBadge priority={testCase.priority} />
        {testCase.stepCount > 0 && (
          <span className="text-xs text-base-content/70">
            {testCase.stepCount} step{testCase.stepCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <span className="text-xs text-base-content/55 tabular-nums">
        {formatDate(testCase.createdAt)}
      </span>
    </div>
  </ResourceCard>
);
