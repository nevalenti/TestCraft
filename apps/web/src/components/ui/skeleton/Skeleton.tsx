import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export const Skeleton = ({ className, style }: SkeletonProps) => (
  <span
    aria-hidden="true"
    className={cn("skeleton-block block rounded-md", className)}
    style={style}
  />
);
