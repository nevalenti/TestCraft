import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

import { accountApi } from '@/api/account';
import client from '@/api/client';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('accountApi.getAvatarUrl', () => {
  describe('given the server returns 200 with a URL', () => {
    it('returns the avatar url payload', async () => {
      vi.mocked(client.get).mockResolvedValue({
        status: 200,
        data: { url: 'https://cdn.example.com/a.png' },
      });

      const result = await accountApi.getAvatarUrl();

      expect(client.get).toHaveBeenCalledWith(
        'account/avatar',
        expect.objectContaining({ validateStatus: expect.any(Function) }),
      );
      expect(result).toEqual({ url: 'https://cdn.example.com/a.png' });
    });
  });

  describe('given the server returns 204 (no avatar set)', () => {
    it('returns null instead of the response body', async () => {
      vi.mocked(client.get).mockResolvedValue({ status: 204, data: null });

      const result = await accountApi.getAvatarUrl();

      expect(result).toBeNull();
    });
  });
});

describe('accountApi.uploadAvatar', () => {
  it('PUTs a multipart form containing the file', async () => {
    vi.mocked(client.put).mockResolvedValue({
      data: { url: 'https://cdn.example.com/new.png' },
    });
    const file = new File(['x'], 'avatar.png', { type: 'image/png' });

    const result = await accountApi.uploadAvatar(file);

    expect(client.put).toHaveBeenCalledWith(
      'account/avatar',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    const formData = vi.mocked(client.put).mock.calls[0][1] as FormData;
    expect(formData.get('file')).toBe(file);
    expect(result).toEqual({ url: 'https://cdn.example.com/new.png' });
  });
});
