import { queryOptions } from '@tanstack/react-query';
import type { AvatarUrl } from '@testcraft/types';

import client from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

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

export const accountQueries = {
  avatarUrl: () =>
    queryOptions({
      queryKey: queryKeys.account.avatarUrl,
      queryFn: () => accountApi.getAvatarUrl(),
      staleTime: 55 * 60 * 1000,
    }),
};
