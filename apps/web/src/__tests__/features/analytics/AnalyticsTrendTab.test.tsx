import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useRequiredParam', () => ({
  useRequiredParam: vi.fn().mockReturnValue('proj-1'),
}));

vi.mock('@/features/analytics/api', () => ({
  analyticsQueries: {
    trend: vi.fn(() => ({
      queryKey: ['unused-trend'],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
  },
}));

import { AnalyticsTrendTab } from '@/features/analytics/AnalyticsTrendTab';
import { analyticsQueries } from '@/features/analytics/api';

const makePoint = (overrides: Partial<Record<string, unknown>> = {}) => ({
  runName: 'Nightly Run',
  createdAt: '2026-01-10T00:00:00Z',
  passRate: 80,
  passed: 8,
  failed: 2,
  blocked: 0,
  skipped: 0,
  total: 10,
  source: undefined,
  ...overrides,
});

const mockTrend = (result: unknown[] | 'error') => {
  vi.mocked(analyticsQueries.trend).mockReturnValue({
    queryKey: ['unused-trend'],
    queryFn:
      result === 'error'
        ? vi.fn().mockRejectedValue(new Error('boom'))
        : vi.fn().mockResolvedValue(result),
    retry: false,
  } as never);
};

const renderWithClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<AnalyticsTrendTab />, { wrapper });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockTrend([]);
});

describe('AnalyticsTrendTab', () => {
  describe('given no trend data — shows the empty-state copy', () => {
    it('prompts to complete a run', async () => {
      renderWithClient();
      expect(await screen.findByText('No run data yet')).toBeInTheDocument();
      expect(
        screen.getByText('Complete a test run to see trend data.'),
      ).toBeInTheDocument();
    });
  });

  describe('given the trend request fails — shows an error state', () => {
    it('renders the failure message', async () => {
      mockTrend('error');
      renderWithClient();
      expect(
        await screen.findByText('Failed to load trend data'),
      ).toBeInTheDocument();
    });
  });

  describe('given trend points from a single source — renders one section', () => {
    it('labels the section with the capitalized source name', async () => {
      mockTrend([
        makePoint({ source: 'jira', runName: 'Run 1' }),
        makePoint({ source: 'jira', runName: 'Run 2' }),
      ]);
      renderWithClient();

      expect(
        await screen.findByRole('heading', { name: 'Jira' }),
      ).toBeInTheDocument();
    });
  });

  describe('given trend points from multiple sources — groups by source', () => {
    it('renders a section per source, with manual runs last', async () => {
      mockTrend([
        makePoint({ source: undefined, runName: 'Manual run' }),
        makePoint({ source: 'testrail', runName: 'TestRail run' }),
      ]);
      renderWithClient();

      const headings = await screen.findAllByRole('heading', { level: 3 });
      expect(headings.map((heading) => heading.textContent)).toEqual([
        'Testrail',
        'Manual',
      ]);
    });
  });
});
