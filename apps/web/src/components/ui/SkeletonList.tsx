import { SkeletonRow } from "@/components/ui/SkeletonRow";

export const SkeletonList = ({ count = 6 }: { count?: number }) => (
  <div
    className="flex flex-col gap-2"
    aria-busy="true"
    aria-label="Loading content"
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </div>
);
