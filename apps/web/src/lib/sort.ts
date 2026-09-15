export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

export const getSortIcon = (sorted: false | SortDirection): string => {
  if (sorted === 'asc') return '▲';
  if (sorted === 'desc') return '▼';

  return '⬍';
};

// Mirrors TanStack Table's default toggle cycle: unsorted -> asc -> desc -> unsorted.
export const toggleSort = <K extends string>(
  current: SortState<K> | null,
  key: K,
): SortState<K> | null => {
  if (!current || current.key !== key) return { key, direction: 'asc' };
  if (current.direction === 'asc') return { key, direction: 'desc' };

  return null;
};
