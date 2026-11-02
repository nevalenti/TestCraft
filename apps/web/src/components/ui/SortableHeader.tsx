import { cn } from "@/lib/cn";
import { getSortIcon, type SortState } from "@/lib/sort";

interface SortableHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  sort: SortState<K> | null;
  onSort: (key: K) => void;
  className?: string;
}

export function SortableHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: SortableHeaderProps<K>) {
  const direction = sort?.key === sortKey ? sort.direction : false;
  const ariaSort = {
    asc: "ascending",
    desc: "descending",
    unsorted: "none",
  } as const;

  return (
    <th className={className} aria-sort={ariaSort[direction || "unsorted"]}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 text-left",
          className,
        )}
      >
        {label}
        <span className="text-fg-subtle" aria-hidden="true">
          {getSortIcon(direction)}
        </span>
      </button>
    </th>
  );
}
