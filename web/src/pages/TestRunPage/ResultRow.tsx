import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/format";
import type { TestResultDto } from "@/types";

import { statusBorderClass } from "./constants";

interface ResultRowProps {
  result: TestResultDto;
  onEdit: () => void;
  onDelete: () => void;
}

export const ResultRow = ({ result, onEdit, onDelete }: ResultRowProps) => (
  <div
    className={`relative bg-base-100 border border-border border-l-4 ${statusBorderClass[result.status]} shadow-sm transition-all duration-150 hover:shadow-md group overflow-hidden`}
  >
    <div className="p-5 flex flex-row gap-4 items-stretch">
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="flex flex-col gap-2">
          <StatusBadge status={result.status} />
          {result.notes && (
            <p className="text-base-content/55 line-clamp-2 text-sm leading-relaxed">
              {result.notes}
            </p>
          )}
        </div>
        <div className="mt-3 space-y-0.5">
          <p className="text-base-content/35 text-xs tabular-nums">
            Executed {formatDateTime(result.executedAt)}
          </p>
          <p className="text-base-content/30 text-xs tabular-nums">
            Logged {formatDate(result.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="btn btn-ghost btn-sm"
          onClick={onEdit}
          aria-label="Edit result"
        >
          <PencilIcon />
        </button>
        <button
          className="btn btn-ghost btn-sm text-error"
          onClick={onDelete}
          aria-label="Delete result"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  </div>
);
