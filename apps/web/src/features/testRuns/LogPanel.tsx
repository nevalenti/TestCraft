import { CommandLineIcon } from "@heroicons/react/24/outline";
import { useLayoutEffect, useRef } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { useRunLogs } from "@/features/testRuns/hooks";

const PINNED_THRESHOLD_PX = 40;

interface Props {
  projectId: string;
  runId: string;
}

export const LogPanel = ({ projectId, runId }: Props) => {
  const { lines, earliestSeq, hasMore, isLoadingEarlier, loadEarlier } =
    useRunLogs(projectId, runId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(true);
  const earliestSeqRef = useRef(earliestSeq);
  const scrollHeightRef = useRef(0);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    const previousEarliestSeq = earliestSeqRef.current;
    earliestSeqRef.current = earliestSeq;
    if (!container) return;

    const didLoadEarlierLines =
      previousEarliestSeq !== null &&
      earliestSeq !== null &&
      earliestSeq < previousEarliestSeq;
    if (didLoadEarlierLines) {
      container.scrollTop += container.scrollHeight - scrollHeightRef.current;
    } else if (isPinnedRef.current) {
      container.scrollTop = container.scrollHeight;
    }
    scrollHeightRef.current = container.scrollHeight;
  }, [lines, earliestSeq]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    isPinnedRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      PINNED_THRESHOLD_PX;
  };

  return lines.length === 0 ? (
    <EmptyState
      icon={<CommandLineIcon className="size-5" />}
      title="No pipeline output yet"
      description="Log lines will stream here once the run starts reporting."
    />
  ) : (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-border bg-base-300">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
        <span className="size-2 rounded-full bg-error" />
        <span className="size-2 rounded-full bg-warning" />
        <span className="size-2 rounded-full bg-success" />
        <span className="ml-2 text-xs font-medium text-fg-subtle">
          Pipeline output
        </span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
      >
        {hasMore && (
          <button
            type="button"
            className="btn mb-2 btn-ghost btn-xs"
            onClick={loadEarlier}
            disabled={isLoadingEarlier}
          >
            {isLoadingEarlier ? "Loading…" : "Load earlier lines"}
          </button>
        )}
        <pre className="font-logs text-xs leading-5 break-all whitespace-pre-wrap text-fg-secondary">
          {lines.join("\n")}
        </pre>
      </div>
    </div>
  );
};
