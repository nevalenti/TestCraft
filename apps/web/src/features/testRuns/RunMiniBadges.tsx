import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/cn";

interface RunMiniBadgesProps {
  passed: number;
  failed: number;
  emphasize?: boolean;
}

export const RunMiniBadges = ({
  passed,
  failed,
  emphasize,
}: RunMiniBadgesProps) => (
  <div className="flex shrink-0 items-center gap-1.5">
    {passed > 0 && (
      <span
        className={cn(
          "flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 font-mono text-xs text-success tabular-nums",
          emphasize && "font-semibold",
        )}
      >
        {passed}
        <CheckCircleIcon className="size-3" />
      </span>
    )}
    {failed > 0 && (
      <span
        className={cn(
          "flex items-center gap-1 rounded-full border border-error/20 bg-error/10 px-2 py-0.5 font-mono text-xs text-error tabular-nums",
          emphasize && "font-semibold",
        )}
      >
        {failed}
        <XCircleIcon className="size-3" />
      </span>
    )}
  </div>
);

export const ResultsBadgesSkeleton = () => (
  <div className="h-5 w-14 shrink-0 rounded-md bg-base-content/10 motion-safe:animate-pulse" />
);
