import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import client from '@/api/client';
import { labelsApi } from '@/features/labels/api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('labelsApi', () => {
  it('getAll fetches labels for the project', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await labelsApi.getAll('p1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/labels');
  });

  it('create posts the new label', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: 'l1' } });

    await labelsApi.create('p1', { name: 'Regression', color: '#f00' } as any);

    expect(client.post).toHaveBeenCalledWith('projects/p1/labels', {
      name: 'Regression',
      color: '#f00',
    });
  });

  it('update puts the label changes', async () => {
    vi.mocked(client.put).mockResolvedValue({ data: { id: 'l1' } });

    await labelsApi.update('p1', 'l1', { name: 'Smoke' } as any);

    expect(client.put).toHaveBeenCalledWith('projects/p1/labels/l1', {
      name: 'Smoke',
    });
  });

  it('delete removes the label by id', () => {
    labelsApi.delete('p1', 'l1');

    expect(client.delete).toHaveBeenCalledWith('projects/p1/labels/l1');
  });

  it('addToCase posts to the nested case-label association endpoint, not the label base path', () => {
    labelsApi.addToCase('p1', 'case1', 'l1');

    expect(client.post).toHaveBeenCalledWith(
      'projects/p1/cases/case1/labels/l1',
    );
  });

  it('removeFromCase deletes the nested case-label association', () => {
    labelsApi.removeFromCase('p1', 'case1', 'l1');

    expect(client.delete).toHaveBeenCalledWith(
      'projects/p1/cases/case1/labels/l1',
    );
  });
});
