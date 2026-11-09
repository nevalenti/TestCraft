import { useId, useState } from "react";

import { cn } from "@/lib/cn";

const CLAMP_THRESHOLD = 80;

interface ExpandableTextProps {
  text: string;
  className?: string;
}

export const ExpandableText = ({ text, className }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textId = useId();
  const isLong = text.length > CLAMP_THRESHOLD;

  return (
    <div className={cn("min-w-0", className)}>
      <p
        id={textId}
        className={cn("wrap-anywhere", isLong && !isExpanded && "line-clamp-2")}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={textId}
          onClick={() => setIsExpanded((previous) => !previous)}
          className="mt-0.5 cursor-pointer text-xs font-medium text-primary hover:underline"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};
