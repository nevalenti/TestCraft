import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import client from '@/api/client';
import { shareTokensApi } from '@/features/shareTokens/api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('shareTokensApi', () => {
  it('getAll fetches share tokens for the run', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await shareTokensApi.getAll('p1', 'r1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/runs/r1/share');
  });

  it('create posts the expiry payload', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: 's1' } });

    await shareTokensApi.create('p1', 'r1', { expiresAt: '2026-01-01' });

    expect(client.post).toHaveBeenCalledWith('projects/p1/runs/r1/share', {
      expiresAt: '2026-01-01',
    });
  });

  it('revoke deletes the token by id', () => {
    shareTokensApi.revoke('p1', 'r1', 's1');

    expect(client.delete).toHaveBeenCalledWith('projects/p1/runs/r1/share/s1');
  });

  it('getByToken fetches the shared run by its public token, not nested under a project', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { runId: 'r1' } });

    const result = await shareTokensApi.getByToken('public-token');

    expect(client.get).toHaveBeenCalledWith('share/public-token');
    expect(result).toEqual({ runId: 'r1' });
  });
});
