import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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
    suiteBreakdown: vi.fn(() => ({
      queryKey: ['unused-breakdown'],
      queryFn: vi.fn().mockResolvedValue([]),
      enabled: false,
    })),
  },
}));

import { AnalyticsSuiteTab } from '@/features/analytics/AnalyticsSuiteTab';
import { analyticsQueries } from '@/features/analytics/api';
import { testRunQueries } from '@/features/testRuns/api';

const runs = [
  { id: 'r1', name: 'Nightly Run', createdAt: '2026-01-10T00:00:00Z' },
];

const mockRuns = () => {
  vi.mocked(testRunQueries.all).mockReturnValue({
    queryKey: ['unused-runs'],
    queryFn: vi.fn().mockResolvedValue({ items: runs }),
  } as never);
};

const mockBreakdown = (result: unknown[] | { error: true }) => {
  vi.mocked(analyticsQueries.suiteBreakdown).mockImplementation(
    (_projectId: string, runId: string) =>
      ({
        queryKey: ['breakdown', runId],
        queryFn:
          result && typeof result === 'object' && 'error' in result
            ? vi.fn().mockRejectedValue(new Error('boom'))
            : vi.fn().mockResolvedValue(result),
        enabled: !!runId,
        retry: false,
      }) as never,
  );
};

const renderWithClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<AnalyticsSuiteTab />, { wrapper });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRuns();
  mockBreakdown([]);
});

describe('AnalyticsSuiteTab', () => {
  describe('given no run selected — prompts to pick one', () => {
    it('shows the no-run-selected empty state', async () => {
      renderWithClient();
      expect(await screen.findByText('No run selected')).toBeInTheDocument();
    });
  });

  describe('given a run with no suite data — shows the no-data empty state', () => {
    it('renders "No suite data"', async () => {
      mockBreakdown([]);
      renderWithClient();
      await screen.findByRole('option', { name: /nightly run/i });

      await userEvent.selectOptions(screen.getByLabelText('Select run'), 'r1');

      expect(await screen.findByText('No suite data')).toBeInTheDocument();
    });
  });

  describe('given the breakdown request fails — shows an error state', () => {
    it('renders the failure message', async () => {
      mockBreakdown({ error: true });
      renderWithClient();
      await screen.findByRole('option', { name: /nightly run/i });

      await userEvent.selectOptions(screen.getByLabelText('Select run'), 'r1');

      expect(
        await screen.findByText('Failed to load suite breakdown'),
      ).toBeInTheDocument();
    });
  });

  describe('given a run with suite breakdown data — shows the selected run summary', () => {
    it('renders the chart container with the selected run summary above it', async () => {
      mockBreakdown([
        { suiteName: 'Auth', passed: 8, failed: 1, blocked: 0, skipped: 0 },
      ]);
      const { container } = renderWithClient();
      await screen.findByRole('option', { name: /nightly run/i });

      await userEvent.selectOptions(screen.getByLabelText('Select run'), 'r1');

      expect(
        await screen.findByText(
          (_, element) =>
            element?.tagName === 'P' &&
            element.classList.contains('tracking-widest'),
        ),
      ).toHaveTextContent('Nightly Run · Jan 10, 2026');
      expect(screen.queryByText('No suite data')).not.toBeInTheDocument();
      expect(
        container.querySelector('.recharts-responsive-container'),
      ).toBeInTheDocument();
    });
  });
});
