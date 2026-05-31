import type { TestResult } from "@testcraft/types";

import { ResourceActions } from "@/components/ui/ResourceActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/format";

interface ResultRowProps {
  result: TestResult;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export const ResultRow = ({
  result,
  index,
  onEdit,
  onDelete,
}: ResultRowProps) => (
  <tr
    data-testid="result-row"
    className="group hover:bg-base-200/50 transition-colors"
  >
    <td className="text-base-content/40 tabular-nums text-xs w-8 pr-0">
      {index}
    </td>
    <td className="font-medium text-sm max-w-xs">
      <span className="line-clamp-1">{result.testCaseName}</span>
    </td>
    <td>
      <StatusBadge status={result.status} />
    </td>
    <td className="text-sm text-base-content/60 max-w-[200px]">
      {result.notes ? (
        <span className="line-clamp-1">{result.notes}</span>
      ) : (
        <span className="text-base-content/30 italic">—</span>
      )}
    </td>
    <td className="text-xs tabular-nums text-base-content/50 whitespace-nowrap">
      {formatDateTime(result.executedAt)}
    </td>
    <td>
      <div className="flex justify-end gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <ResourceActions
          onEdit={onEdit}
          onDelete={onDelete}
          label="result"
          size="xs"
        />
      </div>
    </td>
  </tr>
);
