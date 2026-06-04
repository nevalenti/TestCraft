export const ActiveRunsSkeleton = () => (
  <div className="rounded-lg border border-border bg-base-100 shadow-sm overflow-hidden">
    <ul className="divide-y divide-border">
      {[...Array(3)].map((_, index) => (
        <li key={index} className="flex items-center gap-4 px-5 py-3.5">
          <div className="skeleton size-4 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3.5 w-48 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
        </li>
      ))}
    </ul>
  </div>
);
