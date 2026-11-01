import { PaperClipIcon } from "@heroicons/react/24/outline";
import type { TestResult } from "@testcraft/types";

import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { ResourceActions } from "@/components/ui/resource/ResourceActions";
import { ResultStatusBadge } from "@/components/ui/ResultStatusBadge";
import {
  STATUS_COLOR,
  STATUS_OPTIONS,
} from "@/features/testResults/resultStatus";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";

interface SuiteGroup {
  suiteId: string;
  name: string;
  results: TestResult[];
  counts: Record<string, number>;
  problems: number;
}

const groupBySuite = (
  results: TestResult[],
  suiteNames: Map<string, string>,
): SuiteGroup[] => {
  const groups: SuiteGroup[] = [];
  const bySuite = new Map<string, SuiteGroup>();
  for (const result of results) {
    let group = bySuite.get(result.suite_id);
    if (!group) {
      group = {
        suiteId: result.suite_id,
        name: suiteNames.get(result.suite_id) ?? "Unknown suite",
        results: [],
        counts: {},
        problems: 0,
      };
      bySuite.set(result.suite_id, group);
      groups.push(group);
    }
    group.results.push(result);
    group.counts[result.status] = (group.counts[result.status] ?? 0) + 1;
    if (result.status === "failed" || result.status === "blocked")
      group.problems += 1;
  }

  return groups.toSorted(
    (first, second) =>
      second.problems - first.problems || first.name.localeCompare(second.name),
  );
};

const describeCounts = (counts: Record<string, number>) =>
  STATUS_OPTIONS.filter(({ value }) => (counts[value] ?? 0) > 0)
    .map(({ value, label }) => `${counts[value]} ${label.toLowerCase()}`)
    .join(" · ");

const SuiteBar = ({ group }: { group: SuiteGroup }) => (
  <div
    aria-hidden="true"
    className="hidden h-1.5 w-28 shrink-0 gap-0.5 overflow-hidden rounded-full bg-base-content/8 sm:flex"
  >
    {STATUS_OPTIONS.map(({ value }) =>
      (group.counts[value] ?? 0) > 0 ? (
        <span
          key={value}
          className={cn("h-full", STATUS_COLOR[value])}
          style={{
            width: `${(group.counts[value] / group.results.length) * 100}%`,
          }}
        />
      ) : null,
    )}
  </div>
);

interface ResultsBySuiteProps {
  results: TestResult[];
  suiteNames: Map<string, string>;
  onEdit?: (result: TestResult) => void;
  onDelete?: (result: TestResult) => void;
  onAttachment: (result: TestResult) => void;
}

export const ResultsBySuite = ({
  results,
  suiteNames,
  onEdit,
  onDelete,
  onAttachment,
}: ResultsBySuiteProps) => (
  <div className="flex flex-col gap-3">
    {groupBySuite(results, suiteNames).map((group) => (
      <CollapsibleCard
        key={group.suiteId}
        title={group.name}
        description={describeCounts(group.counts)}
        defaultCollapsed={group.problems === 0}
        actions={<SuiteBar group={group} />}
      >
        <ul>
          {group.results.map((result) => (
            <li
              key={result.id}
              data-testid="suite-result-row"
              className="group flex items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0 hover:bg-base-content/5"
            >
              <ResultStatusBadge status={result.status} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {result.test_case_name}
              </span>
              <span className="hidden text-xs text-fg-muted tabular-nums sm:inline">
                {formatDuration(result.duration_ms)}
              </span>
              <RelativeTime
                value={result.executed_at}
                className="hidden w-20 text-right text-xs text-fg-muted md:inline"
              />
              <span className="flex shrink-0 justify-end gap-0.5 opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => onAttachment(result)}
                  aria-label="Manage attachments"
                >
                  <PaperClipIcon className="size-3.5" />
                </button>
                <ResourceActions
                  onEdit={onEdit && (() => onEdit(result))}
                  onDelete={onDelete && (() => onDelete(result))}
                  label="result"
                  size="xs"
                />
              </span>
            </li>
          ))}
        </ul>
      </CollapsibleCard>
    ))}
  </div>
);
