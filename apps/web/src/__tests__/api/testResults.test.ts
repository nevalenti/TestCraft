import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import client from '@/api/client';
import { testResultsApi } from '@/api/testResults';
import { RESULTS_PAGE_SIZE } from '@/lib/constants';

beforeEach(() => {
  vi.clearAllMocks();
});

const BASE = 'projects/p1/runs/r1/results';

describe('testResultsApi.getAll', () => {
  it('defaults page to 1 and pageSize to RESULTS_PAGE_SIZE, omitting status/search', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await testResultsApi.getAll('p1', 'r1');

    expect(client.get).toHaveBeenCalledWith(BASE, {
      params: { page: 1, pageSize: RESULTS_PAGE_SIZE },
    });
  });

  it('includes status and search and a custom page/pageSize when given', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await testResultsApi.getAll('p1', 'r1', 'Failed', 'login', 2, 10);

    expect(client.get).toHaveBeenCalledWith(BASE, {
      params: {
        page: 2,
        pageSize: 10,
        status: 'Failed',
        search: 'login',
      },
    });
  });
});

describe('testResultsApi other operations', () => {
  it('getById fetches a single result', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: {} });

    await testResultsApi.getById('p1', 'r1', 'res1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/res1`);
  });

  it('create posts the new result', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: {} });

    await testResultsApi.create('p1', 'r1', { status: 'Passed' } as any);

    expect(client.post).toHaveBeenCalledWith(BASE, { status: 'Passed' });
  });

  it('update puts changes including the id', async () => {
    vi.mocked(client.put).mockResolvedValue({ data: {} });

    await testResultsApi.update('p1', 'r1', 'res1', {
      status: 'Failed',
    } as any);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/res1`, {
      status: 'Failed',
      id: 'res1',
    });
  });

  it('delete removes the result by id', () => {
    testResultsApi.delete('p1', 'r1', 'res1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/res1`);
  });
});
