import { useEffect, useRef } from 'react';

import { useResultFeed } from '@/features/testRuns/useResultFeed';

interface Props {
  projectId: string;
  runId: string;
}

export const LogPanel = ({ projectId, runId }: Props) => {
  const { logs } = useResultFeed(projectId, runId);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return logs.length === 0 ? (
    <p className="py-16 text-center text-sm text-base-content/55">
      No pipeline output yet…
    </p>
  ) : (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-border bg-base-300">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
        <span className="size-2 rounded-full bg-error" />
        <span className="size-2 rounded-full bg-warning" />
        <span className="size-2 rounded-full bg-success" />
        <span className="ml-2 text-xs font-medium text-base-content/55">
          Pipeline output
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <pre className="font-logs text-xs leading-5 break-all whitespace-pre-wrap text-base-content/85">
          {logs.join('\n')}
        </pre>
        <div ref={endRef} />
      </div>
    </div>
  );
};
