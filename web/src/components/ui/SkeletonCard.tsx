export const SkeletonCard = () => (
  <div className="bg-base-100 border border-border/80 border-l-4 border-l-base-300 p-5 shadow-sm">
    <div className="flex flex-col gap-3">
      <div className="skeleton h-[14px] w-3/5" />
      <div className="skeleton h-[11px] w-2/5" />
      <div className="skeleton h-[10px] w-1/4 mt-3" />
    </div>
  </div>
);
