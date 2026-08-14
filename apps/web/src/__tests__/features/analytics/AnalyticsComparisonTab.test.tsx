import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useRequiredParam', () => ({
  useRequiredParam: vi.fn().mockReturnValue('proj-1'),
}));

vi.mock('@/features/testRuns/api', () => ({
  testRunQueries: {
    all: vi.fn(() => ({
      queryKey: ['unused-runs'],
      queryFn: vi.fn().mockResolvedValue({ items: [] }),
    })),
  },
}));

vi.mock('@/features/analytics/api', () => ({
  analyticsQueries: {
    runComparison: vi.fn(() => ({
      queryKey: ['unused-comparison'],
      queryFn: vi.fn().mockResolvedValue(null),
      enabled: false,
    })),
  },
}));

import { AnalyticsComparisonTab } from '@/features/analytics/AnalyticsComparisonTab';
import { analyticsQueries } from '@/features/analytics/api';
import { testRunQueries } from '@/features/testRuns/api';

const runs = [
  { id: 'a', name: 'Run A', environment: 'staging' },
  { id: 'b', name: 'Run B', environment: 'staging' },
];

const mockRuns = () => {
  vi.mocked(testRunQueries.all).mockReturnValue({
    queryKey: ['unused-runs'],
    queryFn: vi.fn().mockResolvedValue({ items: runs }),
  } as never);
};

const mockComparison = (result: unknown) => {
  vi.mocked(analyticsQueries.runComparison).mockImplementation(
    (_projectId: string, runAId: string, runBId: string) =>
      ({
        queryKey: ['comparison', runAId, runBId],
        queryFn: vi.fn().mockResolvedValue(result),
        enabled: !!runAId && !!runBId,
      }) as never,
  );
};

const comparisonResult = {
  runAName: 'Run A',
  runBName: 'Run B',
  results: [
    {
      testCaseId: 'tc1',
      testCaseName: 'Regressed test',
      statusInA: 'Passed',
      statusInB: 'Failed',
      isRegression: true,
      isFix: false,
    },
    {
      testCaseId: 'tc2',
      testCaseName: 'Fixed test',
      statusInA: 'Failed',
      statusInB: 'Passed',
      isRegression: false,
      isFix: true,
    },
    {
      testCaseId: 'tc3',
      testCaseName: 'Stable test',
      statusInA: 'Passed',
      statusInB: 'Passed',
      isRegression: false,
      isFix: false,
    },
  ],
};

const renderWithClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<AnalyticsComparisonTab />, { wrapper });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRuns();
  mockComparison(null);
});

describe('AnalyticsComparisonTab', () => {
  describe('given no runs selected — prompts to select two runs', () => {
    it('shows the initial empty state', async () => {
      renderWithClient();
      expect(
        await screen.findByText('Select two runs to compare'),
      ).toBeInTheDocument();
    });

    it('disables the Compare button', async () => {
      renderWithClient();
      await screen.findByText('Run A');
      expect(screen.getByRole('button', { name: /compare/i })).toBeDisabled();
    });
  });

  describe('given two different runs selected — Compare is enabled', () => {
    it('enables the Compare button and runs the comparison on click', async () => {
      mockComparison(comparisonResult);
      renderWithClient();
      await screen.findAllByRole('option', { name: 'Run A' });

      await userEvent.selectOptions(screen.getByLabelText('Run A'), 'a');
      await userEvent.selectOptions(screen.getByLabelText('Run B'), 'b');
      expect(screen.getByRole('button', { name: /compare/i })).toBeEnabled();

      await userEvent.click(screen.getByRole('button', { name: /compare/i }));

      await waitFor(() =>
        expect(screen.getByText('Regressed test')).toBeInTheDocument(),
      );
      expect(screen.getByText('Fixed test')).toBeInTheDocument();
      expect(screen.getByText('Stable test')).toBeInTheDocument();
    });
  });

  describe('given a comparison result — the Changes only filter hides unchanged rows', () => {
    it('shows only regressions and fixes when toggled', async () => {
      mockComparison(comparisonResult);
      renderWithClient();
      await screen.findAllByRole('option', { name: 'Run A' });

      await userEvent.selectOptions(screen.getByLabelText('Run A'), 'a');
      await userEvent.selectOptions(screen.getByLabelText('Run B'), 'b');
      await userEvent.click(screen.getByRole('button', { name: /compare/i }));
      await screen.findByText('Stable test');

      await userEvent.click(
        screen.getByRole('button', { name: /changes only/i }),
      );

      expect(screen.getByText('Regressed test')).toBeInTheDocument();
      expect(screen.getByText('Fixed test')).toBeInTheDocument();
      expect(screen.queryByText('Stable test')).not.toBeInTheDocument();
    });
  });
});
