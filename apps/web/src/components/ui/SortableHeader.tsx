import { cn } from '@/lib/cn';
import { getSortIcon, type SortState } from '@/lib/sort';

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

  return (
    <th
      onClick={() => onSort(sortKey)}
      className={cn('cursor-pointer select-none', className)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <span className="text-base-content/50">{getSortIcon(direction)}</span>
      </span>
    </th>
  );
}
