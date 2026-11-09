export const TabCountBadge = ({ count }: { count: number }) => (
  <span className="rounded-full bg-base-content/10 px-1.5 py-0.5 text-xs font-semibold text-fg-muted tabular-nums group-aria-[current=page]:bg-secondary/15 group-aria-[current=page]:text-base-content group-aria-selected:bg-secondary/15 group-aria-selected:text-base-content">
    {count}
  </span>
);
