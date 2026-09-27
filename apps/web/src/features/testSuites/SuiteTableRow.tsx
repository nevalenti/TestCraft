import { RectangleStackIcon } from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';
import type { TestSuite } from '@testcraft/types';

import { MetaPill } from '@/components/ui/MetaPill';
import { ResourceActions } from '@/components/ui/ResourceActions';
import { formatDate } from '@/lib/format';

interface SuiteTableRowProps {
  suite: TestSuite;
  projectId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const SuiteTableRow = ({
  suite,
  projectId,
  onEdit,
  onDelete,
}: SuiteTableRowProps) => (
  <tr
    data-testid="suite-card"
    className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
  >
    <td>
      <Link
        to={`/projects/${projectId}/suites/${suite.id}`}
        aria-label="Open test suite"
        className="flex min-w-56 items-center gap-2.5"
      >
        <span className="card-bg-primary flex size-7 shrink-0 items-center justify-center rounded-lg border text-primary">
          <RectangleStackIcon className="size-3.5" />
        </span>
        <span
          className="min-w-0 truncate text-sm font-semibold group-hover:underline"
          title={suite.name}
        >
          {suite.name}
        </span>
      </Link>
    </td>
    <td className="max-w-xs truncate text-xs text-base-content/70">
      {suite.description ?? (
        <span className="text-base-content/55 italic">No description</span>
      )}
    </td>
    <td>
      {suite.source ? (
        <MetaPill>{suite.source}</MetaPill>
      ) : (
        <span className="text-xs text-base-content/40">—</span>
      )}
    </td>
    <td className="text-xs whitespace-nowrap text-base-content/65 tabular-nums">
      {formatDate(suite.createdAt)}
    </td>
    <td>
      <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <ResourceActions
          onEdit={onEdit}
          onDelete={onDelete}
          label="test suite"
          size="xs"
        />
      </div>
    </td>
  </tr>
);
