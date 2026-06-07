export const ActiveRunsSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-border bg-base-100 shadow-sm">
    <ul className="divide-y divide-border">
      {[...Array(3)].map((_, index) => (
        <li key={index} className="flex items-center gap-4 px-5 py-3.5">
          <div className="size-4 shrink-0 skeleton rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-48 skeleton rounded" />
            <div className="h-3 w-32 skeleton rounded" />
          </div>
        </li>
      ))}
    </ul>
  </div>
);
