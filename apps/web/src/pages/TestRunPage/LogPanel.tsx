import { useEffect, useRef } from "react";

import { useResultFeed } from "@/hooks/useResultFeed";

interface Props {
  projectId: string;
  runId: string;
}

export const LogPanel = ({ projectId, runId }: Props) => {
  const { logs } = useResultFeed(projectId, runId);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return logs.length === 0 ? (
    <p className="py-16 text-center text-sm text-base-content/55">
      No pipeline output yet…
    </p>
  ) : (
    <div className="overflow-hidden rounded-xl border border-border bg-base-300">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="size-2 rounded-full bg-error" />
        <span className="size-2 rounded-full bg-warning" />
        <span className="size-2 rounded-full bg-success" />
        <span className="ml-2 text-xs font-medium text-base-content/55">
          Pipeline output
        </span>
      </div>
      <div className="px-4 py-3">
        {logs.map((line, i) => (
          <p
            key={i}
            className="font-logs text-xs leading-5 break-all whitespace-pre-wrap text-base-content/85"
          >
            {line}
          </p>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};
