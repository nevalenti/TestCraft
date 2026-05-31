export const SkeletonCard = () => (
  <div
    className="bg-base-100 border border-border rounded-lg p-4 shadow-md"
    aria-hidden="true"
  >
    <div className="flex flex-col gap-3">
      <div className="skeleton h-3.5 w-16" />
      <div className="skeleton h-[14px] w-3/5" />
      <div className="skeleton h-[11px] w-2/5" />
      <div className="skeleton h-[10px] w-1/4 mt-3" />
    </div>
  </div>
);
