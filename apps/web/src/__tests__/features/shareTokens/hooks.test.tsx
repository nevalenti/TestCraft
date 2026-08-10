import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/shareTokens/api', () => ({
  shareTokenQueries: {
    all: vi.fn((projectId: string, runId: string) => ({
      queryKey: ['projects', projectId, 'runs', runId, 'share'],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
    byToken: vi.fn((token: string) => ({
      queryKey: ['share', token],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
  },
  shareTokensApi: {
    create: vi.fn(),
    revoke: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({ notify: vi.fn() }));

import { shareTokenQueries, shareTokensApi } from '@/features/shareTokens/api';
import {
  useCreateShareToken,
  useRevokeShareToken,
  useSharedRun,
  useShareTokens,
} from '@/features/shareTokens/hooks';
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

describe('useShareTokens', () => {
  describe('given projectId and runId — calls the query factory', () => {
    it('calls shareTokenQueries.all with both ids', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useShareTokens('proj-1', 'run-1'), { wrapper });
      expect(shareTokenQueries.all).toHaveBeenCalledWith('proj-1', 'run-1');
    });
  });
});

describe('useSharedRun', () => {
  describe('given a token — calls the byToken query factory', () => {
    it('calls shareTokenQueries.byToken with the token string', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useSharedRun('abc123'), { wrapper });
      expect(shareTokenQueries.byToken).toHaveBeenCalledWith('abc123');
    });
  });
});

describe('useCreateShareToken', () => {
  describe('on mutate — calls API and invalidates cache', () => {
    it('calls shareTokensApi.create with projectId, runId, and input', async () => {
      vi.mocked(shareTokensApi.create).mockResolvedValue({
        id: 'st-1',
        token: 'tok',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useCreateShareToken('proj-1', 'run-1'),
        { wrapper },
      );

      result.current.mutate({ expiresAt: '2027-01-01T00:00:00Z' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(shareTokensApi.create).toHaveBeenCalledWith('proj-1', 'run-1', {
        expiresAt: '2027-01-01T00:00:00Z',
      });
    });

    it('calls API with empty object when no expiry given', async () => {
      vi.mocked(shareTokensApi.create).mockResolvedValue({
        id: 'st-1',
        token: 'tok',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useCreateShareToken('proj-1', 'run-1'),
        { wrapper },
      );

      result.current.mutate({});

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(shareTokensApi.create).toHaveBeenCalledWith('proj-1', 'run-1', {});
    });
  });
});

describe('useRevokeShareToken', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls shareTokensApi.revoke with projectId, runId, and tokenId', async () => {
      vi.mocked(shareTokensApi.revoke).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useRevokeShareToken('proj-1', 'run-1'),
        { wrapper },
      );

      result.current.mutate('st-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(shareTokensApi.revoke).toHaveBeenCalledWith(
        'proj-1',
        'run-1',
        'st-1',
      );
    });

    it("notifies 'Share link revoked' on success", async () => {
      vi.mocked(shareTokensApi.revoke).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useRevokeShareToken('proj-1', 'run-1'),
        { wrapper },
      );

      result.current.mutate('st-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Share link revoked');
    });
  });
});
