export const SkeletonRow = () => (
  <div
    className="flex items-center gap-3 rounded-lg border border-base-content/20 bg-base-100 px-4 py-3 shadow-sm"
    aria-hidden="true"
  >
    <div className="size-8 shrink-0 skeleton rounded-md" />
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="h-[14px] w-2/5 skeleton" />
      <div className="h-[11px] w-1/4 skeleton" />
    </div>
    <div className="hidden shrink-0 items-center gap-2 sm:flex">
      <div className="h-[18px] w-14 skeleton rounded-full" />
      <div className="h-[18px] w-14 skeleton rounded-full" />
      <div className="h-[10px] w-12 skeleton" />
    </div>
  </div>
);
