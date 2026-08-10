import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/testSuites/api', () => ({
  testSuiteQueries: {
    all: vi.fn((projectId: string, search?: string) => ({
      queryKey: ['projects', projectId, 'suites', search],
      queryFn: vi.fn().mockResolvedValue({ items: [] }),
    })),
    detail: vi.fn((projectId: string, id: string) => ({
      queryKey: ['projects', projectId, 'suites', id],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
  },
  testSuitesApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({ notify: vi.fn() }));

import { queryKeys } from '@/api/queryKeys';
import { testSuiteQueries, testSuitesApi } from '@/features/testSuites/api';
import {
  useCreateTestSuite,
  useDeleteTestSuite,
  useTestSuite,
  useTestSuites,
  useUpdateTestSuite,
} from '@/features/testSuites/hooks';
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

describe('useTestSuites', () => {
  describe('given projectId and search — calls the query factory', () => {
    it('calls testSuiteQueries.all with projectId and search', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestSuites('proj-1', 'auth'), { wrapper });
      expect(testSuiteQueries.all).toHaveBeenCalledWith('proj-1', 'auth');
    });
  });
});

describe('useTestSuite', () => {
  describe('given projectId and id — calls the detail query factory', () => {
    it('calls testSuiteQueries.detail with both ids', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestSuite('proj-1', 'suite-1'), { wrapper });
      expect(testSuiteQueries.detail).toHaveBeenCalledWith('proj-1', 'suite-1');
    });
  });
});

describe('useCreateTestSuite', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls testSuitesApi.create with projectId and input', async () => {
      vi.mocked(testSuitesApi.create).mockResolvedValue({
        id: 's1',
        name: 'Auth',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateTestSuite('proj-1'), {
        wrapper,
      });

      result.current.mutate({ name: 'Auth' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testSuitesApi.create).toHaveBeenCalledWith('proj-1', {
        name: 'Auth',
      });
    });

    it("notifies 'Suite created' on success", async () => {
      vi.mocked(testSuitesApi.create).mockResolvedValue({
        id: 's1',
        name: 'Auth',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateTestSuite('proj-1'), {
        wrapper,
      });

      result.current.mutate({ name: 'Auth' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Suite created');
    });
  });

  describe('on success — invalidates suites list and project detail', () => {
    it('marks testSuites.all and projects.detail as stale', async () => {
      vi.mocked(testSuitesApi.create).mockResolvedValue({
        id: 's1',
        name: 'Auth',
      } as any);
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(queryKeys.testSuites.all('proj-1'), {
        items: [],
      });
      queryClient.setQueryData(queryKeys.projects.detail('proj-1'), {
        id: 'proj-1',
      });

      const { result } = renderHook(() => useCreateTestSuite('proj-1'), {
        wrapper,
      });
      result.current.mutate({ name: 'Auth' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(
        queryClient.getQueryState(queryKeys.testSuites.all('proj-1'))
          ?.isInvalidated,
      ).toBe(true);
      expect(
        queryClient.getQueryState(queryKeys.projects.detail('proj-1'))
          ?.isInvalidated,
      ).toBe(true);
    });
  });
});

describe('useUpdateTestSuite', () => {
  describe('on mutate — calls API with id and update payload', () => {
    it('calls testSuitesApi.update with projectId, id, and stripped input', async () => {
      vi.mocked(testSuitesApi.update).mockResolvedValue({
        id: 's1',
        name: 'Auth Suite',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateTestSuite('proj-1'), {
        wrapper,
      });

      result.current.mutate({ id: 's1', name: 'Auth Suite' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testSuitesApi.update).toHaveBeenCalledWith('proj-1', 's1', {
        name: 'Auth Suite',
      });
    });

    it("notifies 'Suite updated' on success", async () => {
      vi.mocked(testSuitesApi.update).mockResolvedValue({
        id: 's1',
        name: 'Auth Suite',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateTestSuite('proj-1'), {
        wrapper,
      });

      result.current.mutate({ id: 's1', name: 'Auth Suite' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Suite updated');
    });
  });

  describe('on success — invalidates list and detail', () => {
    it('marks testSuites.all and testSuites.detail as stale', async () => {
      vi.mocked(testSuitesApi.update).mockResolvedValue({
        id: 's1',
        name: 'Auth Suite',
      } as any);
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(queryKeys.testSuites.all('proj-1'), {
        items: [],
      });
      queryClient.setQueryData(queryKeys.testSuites.detail('proj-1', 's1'), {
        id: 's1',
      });

      const { result } = renderHook(() => useUpdateTestSuite('proj-1'), {
        wrapper,
      });
      result.current.mutate({ id: 's1', name: 'Auth Suite' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(
        queryClient.getQueryState(queryKeys.testSuites.all('proj-1'))
          ?.isInvalidated,
      ).toBe(true);
      expect(
        queryClient.getQueryState(queryKeys.testSuites.detail('proj-1', 's1'))
          ?.isInvalidated,
      ).toBe(true);
    });
  });
});

describe('useDeleteTestSuite', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls testSuitesApi.delete with projectId and suiteId', async () => {
      vi.mocked(testSuitesApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteTestSuite('proj-1'), {
        wrapper,
      });

      result.current.mutate('s1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testSuitesApi.delete).toHaveBeenCalledWith('proj-1', 's1');
    });

    it("notifies 'Suite deleted' on success", async () => {
      vi.mocked(testSuitesApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteTestSuite('proj-1'), {
        wrapper,
      });

      result.current.mutate('s1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Suite deleted');
    });
  });

  describe('on success — removes detail and invalidates list', () => {
    it('removes the suite detail from cache', async () => {
      vi.mocked(testSuitesApi.delete).mockResolvedValue(undefined as any);
      const { queryClient, wrapper } = makeWrapper();
      const detailKey = queryKeys.testSuites.detail('proj-1', 's1');
      queryClient.setQueryData(detailKey, { id: 's1' });

      const { result } = renderHook(() => useDeleteTestSuite('proj-1'), {
        wrapper,
      });
      result.current.mutate('s1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryState(detailKey)).toBeUndefined();
    });
  });
});
