import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRunTrend } from '@/features/analytics/hooks';
import { type TrendEntry } from '@/features/analytics/trendHelpers';
import { TrendSection } from '@/features/analytics/TrendSection';
import { useRequiredParam } from '@/hooks/useRequiredParam';
import { formatDate, truncate } from '@/lib/format';

export const AnalyticsTrendTab = () => {
  const projectId = useRequiredParam('projectId');
  const { data: trend, isError, error, refetch } = useRunTrend(projectId, 20);

  const groups = useMemo(() => {
    const raw = [...(trend ?? [])].toReversed();
    const map = new Map<string, TrendEntry[]>();

    for (const point of raw) {
      const key = point.source ?? '__manual__';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        name: truncate(point.runName, 18),
        fullName: point.runName,
        date: formatDate(point.createdAt),
        passRate: point.passRate,
        passed: point.passed,
        failed: point.failed,
        blocked: point.blocked,
        skipped: point.skipped,
        total: point.total,
      });
    }

    const sorted = [...map].toSorted((groupA, groupB) => {
      if (groupA[0] === '__manual__') return 1;
      if (groupB[0] === '__manual__') return -1;
      return groupA[0].localeCompare(groupB[0]);
    });

    return sorted.map(([key, data], index) => ({
      source: key === '__manual__' ? undefined : key,
      data,
      index,
    }));
  }, [trend]);

  if (isError)
    return (
      <ErrorState
        title="Failed to load trend data"
        error={error}
        onRetry={refetch}
      />
    );

  if (groups.length === 0)
    return (
      <EmptyState
        icon={<ArrowTrendingUpIcon className="size-6" />}
        title="No run data yet"
        description="Complete a test run to see trend data."
      />
    );

  return (
    <div className="space-y-8 pb-10">
      {groups.map((group) => (
        <TrendSection key={group.source ?? '__manual__'} group={group} />
      ))}
    </div>
  );
};
