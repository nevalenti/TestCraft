import { PaperClipIcon } from "@heroicons/react/24/outline";
import { createColumnHelper } from "@tanstack/react-table";
import { type TestResult, TestResultStatus } from "@testcraft/types";

import { RelativeTime } from "@/components/ui/RelativeTime";
import { ResourceActions } from "@/components/ui/resource/ResourceActions";
import { ResultStatusBadge } from "@/components/ui/ResultStatusBadge";
import { DefectTypeBadge } from "@/features/testResults/DefectTypeBadge";
import { formatDuration } from "@/lib/format";

const columnHelper = createColumnHelper<TestResult>();

interface CreateColumnsOptions {
  onEdit?: (result: TestResult) => void;
  onDelete?: (result: TestResult) => void;
  onAttachment: (result: TestResult) => void;
  showNotes?: boolean;
}

export const createColumns = ({
  onEdit,
  onDelete,
  onAttachment,
  showNotes = true,
}: CreateColumnsOptions) => [
  columnHelper.display({
    id: "index",
    header: "#",
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;

      return (
        <span className="text-xs text-fg-muted tabular-nums">
          {pageIndex * pageSize + row.index + 1}
        </span>
      );
    },
  }),
  columnHelper.accessor("test_case_name", {
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
        <ResultStatusBadge status={info.getValue()} />
        {info.getValue() === TestResultStatus.Failed &&
          info.row.original.defect_type && (
            <DefectTypeBadge type={info.row.original.defect_type} />
          )}
      </div>
    ),
  }),
  ...(showNotes
    ? [
        columnHelper.accessor("notes", {
          header: "Notes",
          enableSorting: false,
          cell: (info) => {
            const value = info.getValue();

            return value ? (
              <div
                className="max-w-[200px] cursor-default truncate text-sm text-fg-secondary"
                title={value}
              >
                {value}
              </div>
            ) : (
              <span className="text-sm text-fg-subtle italic">—</span>
            );
          },
        }),
      ]
    : []),
  columnHelper.accessor("duration_ms", {
    header: "Duration",
    enableSorting: true,
    cell: (info) => (
      <span className="text-xs whitespace-nowrap text-fg-secondary tabular-nums">
        {formatDuration(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("executed_at", {
    header: "Executed",
    cell: (info) => (
      <RelativeTime
        value={info.getValue()}
        className="text-xs text-fg-secondary"
      />
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div
        data-actions
        className="flex justify-end gap-0.5 opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => onAttachment(row.original)}
          aria-label="Manage attachments"
        >
          <PaperClipIcon className="size-3.5" />
        </button>
        <ResourceActions
          onEdit={onEdit && (() => onEdit(row.original))}
          onDelete={onDelete && (() => onDelete(row.original))}
          label="result"
          size="xs"
        />
      </div>
    ),
  }),
];
