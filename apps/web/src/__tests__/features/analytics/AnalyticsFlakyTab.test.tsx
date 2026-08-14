import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useRequiredParam', () => ({
  useRequiredParam: vi.fn().mockReturnValue('proj-1'),
}));

vi.mock('@/features/analytics/api', () => ({
  analyticsQueries: {
    flakyTests: vi.fn(() => ({
      queryKey: ['unused-flaky'],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
  },
}));

import { AnalyticsFlakyTab } from '@/features/analytics/AnalyticsFlakyTab';
import { analyticsQueries } from '@/features/analytics/api';

const makeStat = (overrides: Partial<Record<string, unknown>> = {}) => ({
  testCaseId: 't1',
  testCaseName: 'Login succeeds',
  flakRate: 42,
  totalRuns: 10,
  passCount: 6,
  failCount: 4,
  ...overrides,
});

const mockFlakyTests = (items: ReturnType<typeof makeStat>[]) => {
  vi.mocked(analyticsQueries.flakyTests).mockReturnValue({
    queryKey: ['unused-flaky'],
    queryFn: vi.fn().mockResolvedValue(items),
  } as never);
};

const renderWithClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<AnalyticsFlakyTab />, { wrapper });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFlakyTests([]);
});

describe('AnalyticsFlakyTab', () => {
  describe('given no flaky tests — shows the empty state', () => {
    it('renders the empty-state copy', async () => {
      renderWithClient();
      expect(
        await screen.findByText('No flaky tests detected'),
      ).toBeInTheDocument();
    });
  });

  describe('given flaky tests — groups them into risk buckets', () => {
    it('counts high, medium, and low risk tests', async () => {
      mockFlakyTests([
        makeStat({ testCaseId: 't1', testCaseName: 'High risk', flakRate: 70 }),
        makeStat({
          testCaseId: 't2',
          testCaseName: 'Medium risk',
          flakRate: 40,
        }),
        makeStat({ testCaseId: 't3', testCaseName: 'Low risk', flakRate: 10 }),
      ]);
      renderWithClient();

      await screen.findByText('High risk');

      const highCard = screen.getByText('High Risk').closest('div.flex')!;
      const mediumCard = screen.getByText('Medium Risk').closest('div.flex')!;
      const lowCard = screen.getByText('Low Risk').closest('div.flex')!;

      expect(highCard).toHaveTextContent('1');
      expect(mediumCard).toHaveTextContent('1');
      expect(lowCard).toHaveTextContent('1');
    });

    it('sorts rows by descending flake rate', async () => {
      mockFlakyTests([
        makeStat({
          testCaseId: 't1',
          testCaseName: 'Least flaky',
          flakRate: 10,
        }),
        makeStat({
          testCaseId: 't2',
          testCaseName: 'Most flaky',
          flakRate: 90,
        }),
      ]);
      renderWithClient();

      const rows = await screen.findAllByRole('row');
      const bodyRows = rows.slice(1);
      expect(bodyRows[0]).toHaveTextContent('Most flaky');
      expect(bodyRows[1]).toHaveTextContent('Least flaky');
    });

    it('shows pass/fail counts for each test', async () => {
      mockFlakyTests([
        makeStat({
          testCaseId: 't1',
          testCaseName: 'Login succeeds',
          totalRuns: 10,
          passCount: 6,
          failCount: 4,
          flakRate: 40,
        }),
      ]);
      renderWithClient();

      const cell = await screen.findByText('Login succeeds');
      const row = cell.closest('tr')!;
      expect(row).toHaveTextContent('10');
      expect(row).toHaveTextContent('6');
      expect(row).toHaveTextContent('4');
      expect(row).toHaveTextContent('40%');
    });
  });
});
