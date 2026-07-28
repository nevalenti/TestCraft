import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn() },
}));

import { analyticsApi } from '@/api/analytics';
import client from '@/api/client';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('analyticsApi', () => {
  it('getTrend defaults limit to 20 when not provided', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await analyticsApi.getTrend('p1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/analytics/trend', {
      params: { limit: 20 },
    });
  });

  it('getTrend passes an explicit limit through', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await analyticsApi.getTrend('p1', 50);

    expect(client.get).toHaveBeenCalledWith('projects/p1/analytics/trend', {
      params: { limit: 50 },
    });
  });

  it('getSuiteBreakdown fetches breakdown for a specific run', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await analyticsApi.getSuiteBreakdown('p1', 'r1');

    expect(client.get).toHaveBeenCalledWith(
      'projects/p1/analytics/runs/r1/suite-breakdown',
    );
  });

  it('getFlakyTests defaults minRuns to 3', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await analyticsApi.getFlakyTests('p1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/analytics/flaky', {
      params: { minRuns: 3 },
    });
  });

  it('getRunComparison passes both run ids as query params', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: {} });

    await analyticsApi.getRunComparison('p1', 'rA', 'rB');

    expect(client.get).toHaveBeenCalledWith(
      'projects/p1/analytics/runs/compare',
      { params: { runAId: 'rA', runBId: 'rB' } },
    );
  });
});
