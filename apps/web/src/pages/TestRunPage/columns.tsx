import { PaperClipIcon } from "@heroicons/react/24/outline";
import { createColumnHelper } from "@tanstack/react-table";
import { type TestResult, TestResultStatus } from "@testcraft/types";

import { DefectTypeBadge } from "@/components/ui/DefectTypeBadge";
import { ResourceActions } from "@/components/ui/ResourceActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, formatDuration } from "@/lib/format";

const columnHelper = createColumnHelper<TestResult>();

interface CreateColumnsOptions {
  onEdit: (result: TestResult) => void;
  onDelete: (result: TestResult) => void;
  onAttachment: (result: TestResult) => void;
}

export const createColumns = ({
  onEdit,
  onDelete,
  onAttachment,
}: CreateColumnsOptions) => [
  columnHelper.display({
    id: "index",
    header: "#",
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;

      return (
        <span className="text-xs text-base-content/40 tabular-nums">
          {pageIndex * pageSize + row.index + 1}
        </span>
      );
    },
  }),
  columnHelper.accessor("testCaseName", {
    header: "Test Case",
    cell: (info) => (
      <span className="line-clamp-1 text-sm font-medium">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <div className="flex flex-col items-start gap-1">
        <StatusBadge status={info.getValue()} />
        {info.getValue() === TestResultStatus.Failed &&
          info.row.original.defectType && (
            <DefectTypeBadge type={info.row.original.defectType} />
          )}
      </div>
    ),
  }),
  columnHelper.accessor("notes", {
    header: "Notes",
    enableSorting: false,
    cell: (info) => {
      const value = info.getValue();

      return value ? (
        <div
          className="max-w-[200px] cursor-default truncate text-sm text-base-content/60"
          title={value}
        >
          {value}
        </div>
      ) : (
        <span className="text-sm text-base-content/30 italic">—</span>
      );
    },
  }),
  columnHelper.accessor("durationMs", {
    header: "Duration",
    enableSorting: true,
    cell: (info) => (
      <span className="text-xs whitespace-nowrap text-base-content/50 tabular-nums">
        {formatDuration(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("executedAt", {
    header: "Executed",
    cell: (info) => (
      <span className="text-xs whitespace-nowrap text-base-content/50 tabular-nums">
        {formatDateTime(info.getValue())}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-0.5 opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => onAttachment(row.original)}
          aria-label="Manage attachments"
        >
          <PaperClipIcon className="size-3.5" />
        </button>
        <ResourceActions
          onEdit={() => onEdit(row.original)}
          onDelete={() => onDelete(row.original)}
          label="result"
          size="xs"
        />
      </div>
    ),
  }),
];
