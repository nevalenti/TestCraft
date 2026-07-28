import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/testRuns', () => ({
  testRunQueries: {
    all: vi.fn((projectId: string, search?: string) => ({
      queryKey: ['projects', projectId, 'runs', search],
      queryFn: vi.fn().mockResolvedValue({ items: [] }),
    })),
    detail: vi.fn((projectId: string, id: string) => ({
      queryKey: ['projects', projectId, 'runs', id],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
    summary: vi.fn((projectId: string, id: string) => ({
      queryKey: ['projects', projectId, 'runs', id, 'summary'],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
  },
  testRunsApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/api/imports', () => ({
  importsApi: {
    junit: vi.fn(),
    allure: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({ notify: vi.fn() }));

import { importsApi } from '@/api/imports';
import { queryKeys } from '@/api/queryKeys';
import { testRunQueries, testRunsApi } from '@/api/testRuns';
import {
  useCreateTestRun,
  useDeleteTestRun,
  useImportAllure,
  useImportJUnitXml,
  useTestRun,
  useTestRuns,
  useTestRunSummary,
  useUpdateTestRun,
} from '@/hooks/useTestRuns';
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

describe('useTestRuns', () => {
  describe('given a projectId and search — calls the query factory', () => {
    it('calls testRunQueries.all with projectId and search', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestRuns('proj-1', 'smoke'), { wrapper });
      expect(testRunQueries.all).toHaveBeenCalledWith('proj-1', 'smoke');
    });
  });
});

describe('useTestRun', () => {
  describe('given projectId and id — calls the detail query factory', () => {
    it('calls testRunQueries.detail with both ids', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestRun('proj-1', 'run-1'), { wrapper });
      expect(testRunQueries.detail).toHaveBeenCalledWith('proj-1', 'run-1');
    });
  });
});

describe('useTestRunSummary', () => {
  describe('given projectId and runId — calls the summary query factory', () => {
    it('calls testRunQueries.summary with both ids', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestRunSummary('proj-1', 'run-1'), { wrapper });
      expect(testRunQueries.summary).toHaveBeenCalledWith('proj-1', 'run-1');
    });
  });
});

describe('useCreateTestRun', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls testRunsApi.create with projectId and input', async () => {
      vi.mocked(testRunsApi.create).mockResolvedValue({
        id: 'r1',
        name: 'Smoke',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateTestRun('proj-1'), {
        wrapper,
      });

      result.current.mutate({ name: 'Smoke', environment: 'staging' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testRunsApi.create).toHaveBeenCalledWith('proj-1', {
        name: 'Smoke',
        environment: 'staging',
      });
    });

    it("notifies 'Test run created' on success", async () => {
      vi.mocked(testRunsApi.create).mockResolvedValue({
        id: 'r1',
        name: 'Smoke',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateTestRun('proj-1'), {
        wrapper,
      });

      result.current.mutate({ name: 'Smoke', environment: 'staging' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Test run created');
    });
  });

  describe('on mutate failure — sets error state', () => {
    it('is in error state when the API rejects', async () => {
      vi.mocked(testRunsApi.create).mockRejectedValue(
        new Error('Server error'),
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateTestRun('proj-1'), {
        wrapper,
      });

      result.current.mutate({ name: 'Fail', environment: 'ci' });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('on success — invalidates runs list and project detail', () => {
    it('marks testRuns.all and projects.detail as stale', async () => {
      vi.mocked(testRunsApi.create).mockResolvedValue({
        id: 'r1',
        name: 'Smoke',
      } as any);
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(queryKeys.testRuns.all('proj-1'), { items: [] });
      queryClient.setQueryData(queryKeys.projects.detail('proj-1'), {
        id: 'proj-1',
      });

      const { result } = renderHook(() => useCreateTestRun('proj-1'), {
        wrapper,
      });
      result.current.mutate({ name: 'Smoke', environment: 'staging' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(
        queryClient.getQueryState(queryKeys.testRuns.all('proj-1'))
          ?.isInvalidated,
      ).toBe(true);
      expect(
        queryClient.getQueryState(queryKeys.projects.detail('proj-1'))
          ?.isInvalidated,
      ).toBe(true);
    });
  });
});

describe('useUpdateTestRun', () => {
  describe('on mutate — calls API with stripped input', () => {
    it('calls testRunsApi.update with projectId, id, and update payload', async () => {
      vi.mocked(testRunsApi.update).mockResolvedValue({
        id: 'r1',
        name: 'Updated',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateTestRun('proj-1'), {
        wrapper,
      });

      result.current.mutate({
        id: 'r1',
        name: 'Updated',
        environment: 'prod',
        status: 'Completed' as any,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testRunsApi.update).toHaveBeenCalledWith('proj-1', 'r1', {
        name: 'Updated',
        environment: 'prod',
        status: 'Completed',
      });
    });

    it("notifies 'Test run updated' on success", async () => {
      vi.mocked(testRunsApi.update).mockResolvedValue({
        id: 'r1',
        name: 'Updated',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateTestRun('proj-1'), {
        wrapper,
      });

      result.current.mutate({
        id: 'r1',
        name: 'Updated',
        environment: 'prod',
        status: 'Completed' as any,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Test run updated');
    });
  });
});

describe('useDeleteTestRun', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls testRunsApi.delete with projectId and runId', async () => {
      vi.mocked(testRunsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteTestRun('proj-1'), {
        wrapper,
      });

      result.current.mutate('r1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testRunsApi.delete).toHaveBeenCalledWith('proj-1', 'r1');
    });

    it("notifies 'Test run deleted' on success", async () => {
      vi.mocked(testRunsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteTestRun('proj-1'), {
        wrapper,
      });

      result.current.mutate('r1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Test run deleted');
    });
  });

  describe('on success — removes detail and summary from cache', () => {
    it('removes the run detail entry', async () => {
      vi.mocked(testRunsApi.delete).mockResolvedValue(undefined as any);
      const { queryClient, wrapper } = makeWrapper();
      const detailKey = queryKeys.testRuns.detail('proj-1', 'r1');
      queryClient.setQueryData(detailKey, { id: 'r1' });

      const { result } = renderHook(() => useDeleteTestRun('proj-1'), {
        wrapper,
      });
      result.current.mutate('r1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryState(detailKey)).toBeUndefined();
    });

    it('removes the run summary entry', async () => {
      vi.mocked(testRunsApi.delete).mockResolvedValue(undefined as any);
      const { queryClient, wrapper } = makeWrapper();
      const summaryKey = queryKeys.testRuns.summary('proj-1', 'r1');
      queryClient.setQueryData(summaryKey, { total: 5, passed: 5 });

      const { result } = renderHook(() => useDeleteTestRun('proj-1'), {
        wrapper,
      });
      result.current.mutate('r1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryState(summaryKey)).toBeUndefined();
    });
  });
});

describe('useImportJUnitXml', () => {
  describe('on mutate — calls importsApi.junit and notifies', () => {
    it('calls importsApi.junit with projectId and input', async () => {
      vi.mocked(importsApi.junit).mockResolvedValue({ id: 'r1' } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useImportJUnitXml('proj-1'), {
        wrapper,
      });

      result.current.mutate({ xml: '<xml/>', environment: 'ci' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(importsApi.junit).toHaveBeenCalledWith('proj-1', {
        xml: '<xml/>',
        environment: 'ci',
      });
    });
  });
});

describe('useImportAllure', () => {
  describe('on mutate — calls importsApi.allure and notifies', () => {
    it('calls importsApi.allure with projectId and input', async () => {
      vi.mocked(importsApi.allure).mockResolvedValue({ id: 'r1' } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useImportAllure('proj-1'), {
        wrapper,
      });

      result.current.mutate({ results: [], environment: 'ci' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(importsApi.allure).toHaveBeenCalledWith('proj-1', {
        results: [],
        environment: 'ci',
      });
    });

    it("notifies 'Test run imported' on success", async () => {
      vi.mocked(importsApi.allure).mockResolvedValue({ id: 'r1' } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useImportAllure('proj-1'), {
        wrapper,
      });

      result.current.mutate({ results: [], environment: 'ci' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Test run imported');
    });
  });
});
