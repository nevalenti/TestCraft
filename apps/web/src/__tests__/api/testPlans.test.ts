import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import client from '@/api/client';
import { testPlansApi } from '@/api/testPlans';

beforeEach(() => {
  vi.clearAllMocks();
});

const BASE = 'projects/p1/plans/pl1';

describe('testPlansApi', () => {
  it('getAll fetches plans for the project', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await testPlansApi.getAll('p1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/plans');
  });

  it('getById fetches a single plan', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: {} });

    await testPlansApi.getById('p1', 'pl1');

    expect(client.get).toHaveBeenCalledWith(BASE);
  });

  it("getCases fetches the plan's cases sub-resource", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await testPlansApi.getCases('p1', 'pl1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/cases`);
  });

  it('create posts the new plan', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: {} });

    await testPlansApi.create('p1', { name: 'Regression' } as any);

    expect(client.post).toHaveBeenCalledWith('projects/p1/plans', {
      name: 'Regression',
    });
  });

  it('update puts the plan changes', async () => {
    vi.mocked(client.put).mockResolvedValue({ data: {} });

    await testPlansApi.update('p1', 'pl1', { name: 'Renamed' } as any);

    expect(client.put).toHaveBeenCalledWith(BASE, { name: 'Renamed' });
  });

  it('delete removes the plan by id', () => {
    testPlansApi.delete('p1', 'pl1');

    expect(client.delete).toHaveBeenCalledWith(BASE);
  });

  it('addCase posts the case id wrapped as testCaseId', () => {
    testPlansApi.addCase('p1', 'pl1', 'c1');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/cases`, {
      testCaseId: 'c1',
    });
  });

  it('removeCase deletes the case from the plan', () => {
    testPlansApi.removeCase('p1', 'pl1', 'c1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/cases/c1`);
  });

  it('reorderCases puts the new ordering to the order sub-path', () => {
    const cases = [{ testCaseId: 'c1', order: 0 }];

    testPlansApi.reorderCases('p1', 'pl1', cases);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/cases/order`, { cases });
  });

  it("createRun posts to the plan's run endpoint", async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: 'r1' } });

    await testPlansApi.createRun('p1', 'pl1', {
      name: 'Nightly',
      environment: 'ci',
    });

    expect(client.post).toHaveBeenCalledWith(`${BASE}/run`, {
      name: 'Nightly',
      environment: 'ci',
    });
  });
});
