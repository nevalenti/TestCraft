import type { ReactNode } from "react";

import { RunAvatar } from "@/features/testRuns/RunAvatar";
import { cn } from "@/lib/cn";

interface RunAvatarBubbleProps {
  badgeClass: string;
  badgeIcon: ReactNode;
  executedByName?: string | null;
  executedByAvatarUrl?: string | null;
  source?: string | null;
}

export const RunAvatarBubble = ({
  badgeClass,
  badgeIcon,
  executedByName,
  executedByAvatarUrl,
  source,
}: RunAvatarBubbleProps) => {
  const origin = executedByName
    ? `Run by ${executedByName}`
    : source && `Source: ${source}`;

  return (
    <span
      className="relative inline-flex size-8 shrink-0"
      title={origin || undefined}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          badgeClass,
        )}
      >
        {badgeIcon}
      </span>
      {executedByAvatarUrl && (
        <RunAvatar
          executedByName={executedByName}
          executedByAvatarUrl={executedByAvatarUrl}
          size="size-4"
          className="absolute -right-1 -bottom-1 ring-2 ring-base-100"
        />
      )}
    </span>
  );
};
