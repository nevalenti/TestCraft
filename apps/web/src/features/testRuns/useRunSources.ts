import type { TestRun } from '@testcraft/types';
import { useMemo } from 'react';

export const useRunSources = (
  runs: TestRun[] | undefined,
  sourceFilter: string | null,
) =>
  useMemo(() => {
    const allRuns = runs ?? [];
    const sources = [
      ...new Set(allRuns.map((run) => run.source).filter(Boolean) as string[]),
    ].toSorted((sourceA, sourceB) => sourceA.localeCompare(sourceB));

    const sourceCounts = Object.fromEntries(
      sources.map((src) => [
        src,
        allRuns.filter((run) => run.source === src).length,
      ]),
    );

    const visibleRuns = sourceFilter
      ? allRuns.filter((run) => run.source === sourceFilter)
      : runs;

    return { sources, sourceCounts, visibleRuns };
  }, [runs, sourceFilter]);
