export const SkeletonCard = () => (
  <div
    className="rounded-lg border border-border bg-base-100 p-4 shadow-md"
    aria-hidden="true"
  >
    <div className="flex flex-col gap-3">
      <div className="h-3.5 w-16 skeleton" />
      <div className="h-[14px] w-3/5 skeleton" />
      <div className="h-[11px] w-2/5 skeleton" />
      <div className="mt-3 h-[10px] w-1/4 skeleton" />
    </div>
  </div>
);
