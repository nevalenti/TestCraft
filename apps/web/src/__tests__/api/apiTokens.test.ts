import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import { apiTokensApi } from '@/api/apiTokens';
import client from '@/api/client';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('apiTokensApi', () => {
  it('getAll fetches tokens for the project', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await apiTokensApi.getAll('p1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/tokens');
  });

  it('create posts the token input', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: 't1' } });

    await apiTokensApi.create('p1', { name: 'CI token' } as any);

    expect(client.post).toHaveBeenCalledWith('projects/p1/tokens', {
      name: 'CI token',
    });
  });

  it('revoke deletes the token by id', () => {
    apiTokensApi.revoke('p1', 't1');

    expect(client.delete).toHaveBeenCalledWith('projects/p1/tokens/t1');
  });
});
