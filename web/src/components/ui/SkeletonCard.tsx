export const SkeletonCard = () => (
  <div className="bg-base-100 border border-border border-l-4 border-l-base-300 p-5">
    <div className="flex flex-col gap-3">
      <div className="skeleton h-[15px] w-3/5" />
      <div className="skeleton h-[11px] w-2/5" />
      <div className="skeleton h-[10px] w-1/4 mt-2" />
    </div>
  </div>
);
