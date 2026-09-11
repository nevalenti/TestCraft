import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

import client from '@/api/client';
import { importsApi } from '@/features/testRuns/resultImport/importsApi';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('importsApi', () => {
  it('junit posts the report to the junit endpoint', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: 'run1' } });
    const input = { xml: '<xml/>', environment: 'ci' };

    await importsApi.junit('p1', input);

    expect(client.post).toHaveBeenCalledWith('projects/p1/import/junit', input);
  });

  it('allure posts the results to the allure endpoint', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: 'run2' } });
    const input = { results: [], environment: 'ci' };

    await importsApi.allure('p1', input);

    expect(client.post).toHaveBeenCalledWith(
      'projects/p1/import/allure',
      input,
    );
  });

  it('getJob fetches the import job by id', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: { id: 'job1', status: 'Completed' },
    });

    await importsApi.getJob('p1', 'job1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/import/job1');
  });
});
