import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import client from '@/api/client';
import { testRunsApi } from '@/api/testRuns';
import { PAGE_SIZE } from '@/lib/constants';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('testRunsApi', () => {
  it('getAll omits search when not given', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await testRunsApi.getAll('p1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/runs', {
      params: { pageSize: PAGE_SIZE },
    });
  });

  it('getAll includes search when given', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await testRunsApi.getAll('p1', 'nightly');

    expect(client.get).toHaveBeenCalledWith('projects/p1/runs', {
      params: { pageSize: PAGE_SIZE, search: 'nightly' },
    });
  });

  it('getById fetches a single run', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: {} });

    await testRunsApi.getById('p1', 'r1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/runs/r1');
  });

  it('create posts the new run', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: {} });

    await testRunsApi.create('p1', { name: 'Nightly' } as any);

    expect(client.post).toHaveBeenCalledWith('projects/p1/runs', {
      name: 'Nightly',
    });
  });

  it('update puts changes including the id', async () => {
    vi.mocked(client.put).mockResolvedValue({ data: {} });

    await testRunsApi.update('p1', 'r1', { name: 'Renamed' } as any);

    expect(client.put).toHaveBeenCalledWith('projects/p1/runs/r1', {
      name: 'Renamed',
      id: 'r1',
    });
  });

  it('delete removes the run by id', () => {
    testRunsApi.delete('p1', 'r1');

    expect(client.delete).toHaveBeenCalledWith('projects/p1/runs/r1');
  });

  it("getSummary fetches the run's summary sub-resource", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: {} });

    await testRunsApi.getSummary('p1', 'r1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/runs/r1/summary');
  });

  it("getLogs fetches the run's logs sub-resource", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await testRunsApi.getLogs('p1', 'r1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/runs/r1/logs');
  });
});
