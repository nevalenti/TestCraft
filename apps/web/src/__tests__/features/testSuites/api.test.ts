import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import client from '@/api/client';
import { testSuitesApi } from '@/features/testSuites/api';
import { PAGE_SIZE } from '@/lib/constants';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('testSuitesApi', () => {
  it('getAll omits search when not given', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await testSuitesApi.getAll('p1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/suites', {
      params: { pageSize: PAGE_SIZE },
    });
  });

  it('getAll includes search when given', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await testSuitesApi.getAll('p1', 'auth');

    expect(client.get).toHaveBeenCalledWith('projects/p1/suites', {
      params: { pageSize: PAGE_SIZE, search: 'auth' },
    });
  });

  it('getById fetches a single suite', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: {} });

    await testSuitesApi.getById('p1', 's1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/suites/s1');
  });

  it('create posts the new suite', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: {} });

    await testSuitesApi.create('p1', { name: 'Auth' } as any);

    expect(client.post).toHaveBeenCalledWith('projects/p1/suites', {
      name: 'Auth',
    });
  });

  it('update puts changes including the id', async () => {
    vi.mocked(client.put).mockResolvedValue({ data: {} });

    await testSuitesApi.update('p1', 's1', { name: 'Renamed' } as any);

    expect(client.put).toHaveBeenCalledWith('projects/p1/suites/s1', {
      name: 'Renamed',
      id: 's1',
    });
  });

  it('delete removes the suite by id', () => {
    testSuitesApi.delete('p1', 's1');

    expect(client.delete).toHaveBeenCalledWith('projects/p1/suites/s1');
  });
});
