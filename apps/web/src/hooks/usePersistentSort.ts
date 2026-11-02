import { type SetStateAction, useCallback, useState } from "react";

import type { SortState } from "@/lib/sort";
import { readStorage, writeStorage } from "@/lib/storage";

const STORAGE_PREFIX = "testcraft:sort:";

const readSort = <K extends string>(
  storageKey: string,
  keys: readonly K[],
): SortState<K> | null => {
  try {
    const stored = JSON.parse(
      readStorage(STORAGE_PREFIX + storageKey) ?? "null",
    ) as Partial<SortState<K>> | null;
    if (
      stored &&
      keys.includes(stored.key as K) &&
      (stored.direction === "asc" || stored.direction === "desc")
    )
      return { key: stored.key as K, direction: stored.direction };
  } catch {
    return null;
  }

  return null;
};

export const usePersistentSort = <K extends string>(
  storageKey: string,
  keys: readonly K[],
) => {
  const [sort, setSortState] = useState(() => readSort(storageKey, keys));

  const setSort = useCallback(
    (next: SetStateAction<SortState<K> | null>) =>
      setSortState((previous) => {
        const value = typeof next === "function" ? next(previous) : next;
        writeStorage(
          STORAGE_PREFIX + storageKey,
          value && JSON.stringify(value),
        );
        return value;
      }),
    [storageKey],
  );

  return [sort, setSort] as const;
};
