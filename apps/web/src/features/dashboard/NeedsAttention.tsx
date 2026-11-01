import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import type { FailingTest } from "@testcraft/types";

import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { RelativeTime } from "@/components/ui/RelativeTime";

interface NeedsAttentionProps {
  tests: FailingTest[];
  windowDays: number;
}

export const NeedsAttention = ({ tests, windowDays }: NeedsAttentionProps) => (
  <CollapsibleCard
    title="Needs attention"
    description={`Tests failing most in the last ${windowDays} days`}
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
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-base-content/5"
            >
              <XCircleIcon
                className="mt-0.5 size-4 shrink-0 text-error"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-base-content">
                  {test.test_case_name}
                </span>
                <span className="block truncate text-xs text-fg-subtle">
                  {test.project_name} · failed {test.failure_count}× · last{" "}
                  <RelativeTime value={test.last_failed_at} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </CollapsibleCard>
);
