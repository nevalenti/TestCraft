import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import client from '@/api/client';
import { testCaseStepsApi } from '@/features/testCaseSteps/api';
import { PAGE_SIZE } from '@/lib/constants';

beforeEach(() => {
  vi.clearAllMocks();
});

const BASE = 'projects/p1/suites/s1/cases/c1/steps';

describe('testCaseStepsApi', () => {
  it('getAll fetches the page of steps for the case', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await testCaseStepsApi.getAll('p1', 's1', 'c1');

    expect(client.get).toHaveBeenCalledWith(BASE, {
      params: { pageSize: PAGE_SIZE },
    });
  });

  it('getById fetches a single step', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { id: 'st1' } });

    await testCaseStepsApi.getById('p1', 's1', 'c1', 'st1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/st1`);
  });

  it('create posts the new step', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: 'st1' } });

    await testCaseStepsApi.create('p1', 's1', 'c1', {
      action: 'Click login',
    } as any);

    expect(client.post).toHaveBeenCalledWith(BASE, { action: 'Click login' });
  });

  it('update puts the step changes including the id', async () => {
    vi.mocked(client.put).mockResolvedValue({ data: { id: 'st1' } });

    await testCaseStepsApi.update('p1', 's1', 'c1', 'st1', {
      action: 'Click submit',
    } as any);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/st1`, {
      action: 'Click submit',
      id: 'st1',
    });
  });

  it('bulkReorder puts the new order to the reorder endpoint', () => {
    testCaseStepsApi.bulkReorder('p1', 's1', 'c1', { steps: [] } as any);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/reorder`, { steps: [] });
  });

  it('delete removes the step by id', () => {
    testCaseStepsApi.delete('p1', 's1', 'c1', 'st1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/st1`);
  });
});
