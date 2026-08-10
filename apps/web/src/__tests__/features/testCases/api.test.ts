import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import client from '@/api/client';
import { testCasesApi } from '@/features/testCases/api';
import { PAGE_SIZE } from '@/lib/constants';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('testCasesApi.getAllByProject', () => {
  it('fetches all project-wide cases, not scoped to a suite', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await testCasesApi.getAllByProject('p1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/cases', {
      params: { pageSize: PAGE_SIZE },
    });
  });
});

describe('testCasesApi.getAll', () => {
  it('scopes to the suite and omits search when not given', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await testCasesApi.getAll('p1', 's1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/suites/s1/cases', {
      params: { pageSize: PAGE_SIZE },
    });
  });

  it('includes search when given', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await testCasesApi.getAll('p1', 's1', 'login');

    expect(client.get).toHaveBeenCalledWith('projects/p1/suites/s1/cases', {
      params: { pageSize: PAGE_SIZE, search: 'login' },
    });
  });
});

describe('testCasesApi other operations', () => {
  it('getById fetches a single case scoped to the suite', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: {} });

    await testCasesApi.getById('p1', 's1', 'c1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/suites/s1/cases/c1');
  });

  it('create posts the new case scoped to the suite', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: {} });

    await testCasesApi.create('p1', 's1', { title: 'Login works' } as any);

    expect(client.post).toHaveBeenCalledWith('projects/p1/suites/s1/cases', {
      title: 'Login works',
    });
  });

  it('update puts changes including the id', async () => {
    vi.mocked(client.put).mockResolvedValue({ data: {} });

    await testCasesApi.update('p1', 's1', 'c1', {
      title: 'Renamed',
    } as any);

    expect(client.put).toHaveBeenCalledWith('projects/p1/suites/s1/cases/c1', {
      title: 'Renamed',
      id: 'c1',
    });
  });

  it('delete removes the case by id', () => {
    testCasesApi.delete('p1', 's1', 'c1');

    expect(client.delete).toHaveBeenCalledWith(
      'projects/p1/suites/s1/cases/c1',
    );
  });
});
