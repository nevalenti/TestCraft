import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/apiTokens/api', () => ({
  apiTokenQueries: {
    all: vi.fn((projectId: string) => ({
      queryKey: ['projects', projectId, 'tokens'],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
  },
  apiTokensApi: {
    create: vi.fn(),
    revoke: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({ notify: vi.fn() }));

import { apiTokenQueries, apiTokensApi } from '@/features/apiTokens/api';
import {
  useApiTokens,
  useCreateApiToken,
  useRevokeApiToken,
} from '@/features/apiTokens/hooks';
import { notify } from '@/lib/notify';

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

describe('useApiTokens', () => {
  describe('given a projectId — calls the query factory', () => {
    it('calls apiTokenQueries.all with the projectId', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useApiTokens('proj-1'), { wrapper });
      expect(apiTokenQueries.all).toHaveBeenCalledWith('proj-1');
    });
  });
});

describe('useCreateApiToken', () => {
  describe('on mutate — calls API and invalidates cache', () => {
    it('calls apiTokensApi.create with projectId and input', async () => {
      vi.mocked(apiTokensApi.create).mockResolvedValue({
        id: 'tok-1',
        token: 'secret',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateApiToken('proj-1'), {
        wrapper,
      });

      result.current.mutate({ name: 'CI Token' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(apiTokensApi.create).toHaveBeenCalledWith('proj-1', {
        name: 'CI Token',
      });
    });

    it('does not call notify (token is shown inline, not via toast)', async () => {
      vi.mocked(apiTokensApi.create).mockResolvedValue({
        id: 'tok-1',
        token: 'secret',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateApiToken('proj-1'), {
        wrapper,
      });

      result.current.mutate({ name: 'CI Token' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).not.toHaveBeenCalled();
    });
  });
});

describe('useRevokeApiToken', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls apiTokensApi.revoke with projectId and tokenId', async () => {
      vi.mocked(apiTokensApi.revoke).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useRevokeApiToken('proj-1'), {
        wrapper,
      });

      result.current.mutate('tok-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(apiTokensApi.revoke).toHaveBeenCalledWith('proj-1', 'tok-1');
    });

    it("notifies 'Token revoked' on success", async () => {
      vi.mocked(apiTokensApi.revoke).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useRevokeApiToken('proj-1'), {
        wrapper,
      });

      result.current.mutate('tok-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Token revoked');
    });
  });
});
