import type { AvatarUrl } from '@testcraft/types';

import client from '@/api/client';

export const accountApi = {
  getAvatarUrl: async (): Promise<AvatarUrl | null> => {
    const { status, data } = await client.get<AvatarUrl>('account/avatar', {
      validateStatus: (statusCode) => statusCode === 200 || statusCode === 204,
    });
    return status === 204 ? null : data;
  },

  uploadAvatar: async (file: File): Promise<AvatarUrl> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await client.put<AvatarUrl>('account/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
