import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import type { FailingTest } from "@testcraft/types";

import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { RelativeTime } from "@/components/ui/RelativeTime";

interface NeedsAttentionProps {
  tests: FailingTest[];
}

export const NeedsAttention = ({ tests }: NeedsAttentionProps) => (
  <CollapsibleCard
    icon={
      <ExclamationTriangleIcon
        className="size-4 shrink-0 text-warning"
        aria-hidden="true"
      />
    }
    title="Needs attention"
    storageKey="dashboard-needs-attention"
  >
    {tests.length === 0 ? (
      <div className="flex flex-1 items-center gap-3 px-4 py-6 text-sm text-fg-muted">
        <CheckCircleIcon className="size-5 text-success" aria-hidden="true" />
        Nothing failed this week.
      </div>
    ) : (
      <ul>
        {tests.map((test) => (
          <li
            key={test.test_case_id}
            className="border-b border-border/60 last:border-b-0"
          >
            <Link
              to="/projects/$projectId/suites/$suiteId/cases/$caseId"
              params={{
                projectId: test.project_id,
                suiteId: test.suite_id,
                caseId: test.test_case_id,
              }}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-base-content/5"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-error/15 text-error"
              >
                <XCircleIcon className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-base-content">
                  {test.test_case_name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-fg-subtle">
                  {test.project_name} · last{" "}
                  <RelativeTime value={test.last_failed_at} />
                </span>
              </span>
              <span className="shrink-0 rounded-md bg-error/15 px-2 py-0.5 text-xs font-semibold text-error tabular-nums">
                {test.failure_count}× failed
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </CollapsibleCard>
);
