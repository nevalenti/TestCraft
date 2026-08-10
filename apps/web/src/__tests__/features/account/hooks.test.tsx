import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/account/api', () => {
  const accountApi = { getAvatarUrl: vi.fn(), uploadAvatar: vi.fn() };
  return {
    accountApi,
    accountQueries: {
      avatarUrl: vi.fn(() => ({
        queryKey: ['account', 'avatar'],
        queryFn: accountApi.getAvatarUrl,
      })),
    },
  };
});

import { queryKeys } from '@/api/queryKeys';
import { accountApi } from '@/features/account/api';
import { useAvatarUrl, useUploadAvatar } from '@/features/account/hooks';

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAvatarUrl', () => {
  it('fetches the avatar url via accountApi', async () => {
    vi.mocked(accountApi.getAvatarUrl).mockResolvedValue({
      url: 'https://cdn/x.png',
    } as any);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useAvatarUrl(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(accountApi.getAvatarUrl).toHaveBeenCalled();
    expect(result.current.data).toEqual({ url: 'https://cdn/x.png' });
  });
});

describe('useUploadAvatar', () => {
  it('uploads the file and seeds the avatar url cache with the response', async () => {
    vi.mocked(accountApi.uploadAvatar).mockResolvedValue({
      url: 'https://cdn/new.png',
    } as any);
    const { queryClient, wrapper } = makeWrapper();
    const file = new File(['x'], 'a.png');

    const { result } = renderHook(() => useUploadAvatar(), { wrapper });
    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(accountApi.uploadAvatar).toHaveBeenCalledWith(file);
    expect(queryClient.getQueryData(queryKeys.account.avatarUrl)).toEqual({
      url: 'https://cdn/new.png',
    });
  });
});
