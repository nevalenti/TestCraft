import { Squares2X2Icon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSuiteBreakdown } from '@/features/analytics/hooks';
import { SuiteTooltip } from '@/features/analytics/SuiteTooltip';
import { useTestRuns } from '@/features/testRuns/hooks';
import { useRequiredParam } from '@/hooks/useRequiredParam';
import { formatDate, truncate } from '@/lib/format';

const COLORS = {
  passed: '#36d399',
  failed: '#f87272',
  blocked: '#fbbd23',
  skipped: '#94a3b8',
};

export const AnalyticsSuiteTab = () => {
  const projectId = useRequiredParam('projectId');
  const {
    data: runs,
    isError: isRunsError,
    error: runsError,
    refetch: refetchRuns,
  } = useTestRuns(projectId);
  const [suiteRunId, setSuiteRunId] = useState('');

  const {
    data: suiteBreakdown,
    isError: isSuiteBreakdownError,
    error: suiteBreakdownError,
    refetch: refetchSuiteBreakdown,
  } = useSuiteBreakdown(projectId, suiteRunId);

  const suiteData = useMemo(
    () =>
      (suiteBreakdown ?? []).map((suite) => ({
        ...suite,
        suiteName: truncate(suite.suiteName, 14),
        suiteNameFull: suite.suiteName,
      })),
    [suiteBreakdown],
  );

  if (isRunsError) {
    return (
      <ErrorState
        title="Failed to load runs"
        error={runsError}
        onRetry={refetchRuns}
      />
    );
  }

  const selectedRun = runs?.find((run) => run.id === suiteRunId);

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label
            htmlFor="suite-run-select"
            className="mb-1 block text-xs font-medium text-base-content/75"
          >
            Select run
          </label>
          <select
            id="suite-run-select"
            className="select-bordered select w-full max-w-sm select-sm"
            value={suiteRunId}
            onChange={(event) => setSuiteRunId(event.target.value)}
          >
            <option value="">Choose a run to inspect…</option>
            {(runs ?? []).map((run) => (
              <option key={run.id} value={run.id}>
                {run.name} · {formatDate(run.createdAt)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!suiteRunId && (
        <EmptyState
          icon={<Squares2X2Icon className="size-6" />}
          title="No run selected"
          description="Select a test run above to see how its results are distributed across suites."
        />
      )}

      {suiteRunId && isSuiteBreakdownError && (
        <ErrorState
          title="Failed to load suite breakdown"
          error={suiteBreakdownError}
          onRetry={refetchSuiteBreakdown}
        />
      )}

      {suiteRunId && !isSuiteBreakdownError && suiteData.length === 0 && (
        <EmptyState
          icon={<Squares2X2Icon className="size-6" />}
          title="No suite data"
          description="This run has no suite breakdown data available."
        />
      )}

      {suiteRunId && !isSuiteBreakdownError && suiteData.length > 0 && (
        <div className="rounded-xl border border-border bg-base-100 px-4 pt-4 pb-2">
          {selectedRun && (
            <p className="mb-4 truncate text-xs font-semibold tracking-widest text-base-content/65 uppercase">
              {selectedRun.name} · {formatDate(selectedRun.createdAt)}
            </p>
          )}
          <ResponsiveContainer width="100%" height={288}>
            <BarChart
              data={suiteData}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.06}
                vertical={false}
              />
              <XAxis
                dataKey="suiteName"
                tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.4 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.4 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                content={<SuiteTooltip />}
                cursor={{ fill: 'currentColor', fillOpacity: 0.04 }}
              />
              <Legend
                iconType="circle"
                iconSize={7}
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              />
              <Bar
                dataKey="passed"
                name="Passed"
                stackId="a"
                fill={COLORS.passed}
              />
              <Bar
                dataKey="failed"
                name="Failed"
                stackId="a"
                fill={COLORS.failed}
              />
              <Bar
                dataKey="blocked"
                name="Blocked"
                stackId="a"
                fill={COLORS.blocked}
              />
              <Bar
                dataKey="skipped"
                name="Skipped"
                stackId="a"
                fill={COLORS.skipped}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
