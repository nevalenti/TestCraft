import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import client from '@/api/client';
import { projectMembersApi } from '@/features/projectMembers/api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('projectMembersApi', () => {
  it('getAll fetches members for the project', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await projectMembersApi.getAll('p1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/members');
  });

  it('add posts the new member payload', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: 'm1' } });

    await projectMembersApi.add('p1', { userId: 'u1', role: 'Editor' } as any);

    expect(client.post).toHaveBeenCalledWith('projects/p1/members', {
      userId: 'u1',
      role: 'Editor',
    });
  });

  it('remove deletes the member by id', () => {
    projectMembersApi.remove('p1', 'm1');

    expect(client.delete).toHaveBeenCalledWith('projects/p1/members/m1');
  });
});
