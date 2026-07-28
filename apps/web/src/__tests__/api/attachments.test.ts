import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import { attachmentsApi } from '@/api/attachments';
import client from '@/api/client';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('attachmentsApi', () => {
  it('getAll fetches attachments for the result', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await attachmentsApi.getAll('p1', 'r1', 'res1');

    expect(client.get).toHaveBeenCalledWith(
      'projects/p1/runs/r1/results/res1/attachments',
    );
  });

  it('upload posts a multipart form with the file', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: 'a1' } });
    const file = new File(['x'], 'log.txt', { type: 'text/plain' });

    await attachmentsApi.upload('p1', 'r1', 'res1', file);

    expect(client.post).toHaveBeenCalledWith(
      'projects/p1/runs/r1/results/res1/attachments',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    const formData = vi.mocked(client.post).mock.calls[0][1] as FormData;
    expect(formData.get('file')).toBe(file);
  });

  it('getDownloadUrl returns just the url string from the response', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: { url: 'https://cdn.example.com/a1' },
    });

    const url = await attachmentsApi.getDownloadUrl('p1', 'r1', 'res1', 'a1');

    expect(client.get).toHaveBeenCalledWith(
      'projects/p1/runs/r1/results/res1/attachments/a1/download',
    );
    expect(url).toBe('https://cdn.example.com/a1');
  });

  it('delete removes the attachment by id', () => {
    attachmentsApi.delete('p1', 'r1', 'res1', 'a1');

    expect(client.delete).toHaveBeenCalledWith(
      'projects/p1/runs/r1/results/res1/attachments/a1',
    );
  });
});
