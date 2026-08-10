import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/labels/api', () => ({
  labelQueries: {
    all: vi.fn((projectId: string) => ({
      queryKey: ['projects', projectId, 'labels'],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
  },
  labelsApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addToCase: vi.fn(),
    removeFromCase: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({ notify: vi.fn() }));

import { queryKeys } from '@/api/queryKeys';
import { labelQueries, labelsApi } from '@/features/labels/api';
import {
  useAddTestCaseLabel,
  useCreateLabel,
  useDeleteLabel,
  useLabels,
  useRemoveTestCaseLabel,
  useUpdateLabel,
} from '@/features/labels/hooks';
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

describe('useLabels', () => {
  describe('given a projectId — calls the query factory', () => {
    it('calls labelQueries.all with the projectId', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useLabels('proj-1'), { wrapper });
      expect(labelQueries.all).toHaveBeenCalledWith('proj-1');
    });
  });
});

describe('useCreateLabel', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls labelsApi.create with projectId and input', async () => {
      vi.mocked(labelsApi.create).mockResolvedValue({
        id: 'lbl-1',
        name: 'Bug',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateLabel('proj-1'), {
        wrapper,
      });

      result.current.mutate({ name: 'Bug', color: '#FF0000' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(labelsApi.create).toHaveBeenCalledWith('proj-1', {
        name: 'Bug',
        color: '#FF0000',
      });
    });

    it("notifies 'Label created' on success", async () => {
      vi.mocked(labelsApi.create).mockResolvedValue({
        id: 'lbl-1',
        name: 'Bug',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateLabel('proj-1'), {
        wrapper,
      });

      result.current.mutate({ name: 'Bug', color: '#FF0000' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Label created');
    });
  });

  describe('on success — invalidates labels list', () => {
    it('marks labels.all as stale', async () => {
      vi.mocked(labelsApi.create).mockResolvedValue({
        id: 'lbl-1',
        name: 'Bug',
      } as any);
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(queryKeys.labels.all('proj-1'), []);

      const { result } = renderHook(() => useCreateLabel('proj-1'), {
        wrapper,
      });
      result.current.mutate({ name: 'Bug', color: '#FF0000' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(
        queryClient.getQueryState(queryKeys.labels.all('proj-1'))
          ?.isInvalidated,
      ).toBe(true);
    });
  });
});

describe('useUpdateLabel', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls labelsApi.update with projectId, id, and update payload', async () => {
      vi.mocked(labelsApi.update).mockResolvedValue({
        id: 'lbl-1',
        name: 'Blocker',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateLabel('proj-1'), {
        wrapper,
      });

      result.current.mutate({ id: 'lbl-1', name: 'Blocker', color: '#FF0000' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(labelsApi.update).toHaveBeenCalledWith('proj-1', 'lbl-1', {
        name: 'Blocker',
        color: '#FF0000',
      });
    });

    it("notifies 'Label updated' on success", async () => {
      vi.mocked(labelsApi.update).mockResolvedValue({ id: 'lbl-1' } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateLabel('proj-1'), {
        wrapper,
      });

      result.current.mutate({ id: 'lbl-1', name: 'X', color: '#000' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Label updated');
    });
  });
});

describe('useDeleteLabel', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls labelsApi.delete with projectId and labelId', async () => {
      vi.mocked(labelsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteLabel('proj-1'), {
        wrapper,
      });

      result.current.mutate('lbl-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(labelsApi.delete).toHaveBeenCalledWith('proj-1', 'lbl-1');
    });

    it("notifies 'Label deleted' on success", async () => {
      vi.mocked(labelsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteLabel('proj-1'), {
        wrapper,
      });

      result.current.mutate('lbl-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Label deleted');
    });
  });
});

describe('useAddTestCaseLabel', () => {
  describe('on mutate — calls addToCase API', () => {
    it('calls labelsApi.addToCase with projectId, caseId, and labelId', async () => {
      vi.mocked(labelsApi.addToCase).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useAddTestCaseLabel('proj-1', 'suite-1', 'case-1'),
        { wrapper },
      );

      result.current.mutate('lbl-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(labelsApi.addToCase).toHaveBeenCalledWith(
        'proj-1',
        'case-1',
        'lbl-1',
      );
    });

    it("notifies 'Label added' on success", async () => {
      vi.mocked(labelsApi.addToCase).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useAddTestCaseLabel('proj-1', 'suite-1', 'case-1'),
        { wrapper },
      );

      result.current.mutate('lbl-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Label added');
    });
  });

  describe('on success — invalidates test case queries', () => {
    it('marks the case detail and case list as stale', async () => {
      vi.mocked(labelsApi.addToCase).mockResolvedValue(undefined as any);
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(
        queryKeys.testCases.detail('proj-1', 'suite-1', 'case-1'),
        { id: 'case-1' },
      );
      queryClient.setQueryData(queryKeys.testCases.all('proj-1', 'suite-1'), {
        items: [],
      });

      const { result } = renderHook(
        () => useAddTestCaseLabel('proj-1', 'suite-1', 'case-1'),
        { wrapper },
      );
      result.current.mutate('lbl-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(
        queryClient.getQueryState(
          queryKeys.testCases.detail('proj-1', 'suite-1', 'case-1'),
        )?.isInvalidated,
      ).toBe(true);
      expect(
        queryClient.getQueryState(queryKeys.testCases.all('proj-1', 'suite-1'))
          ?.isInvalidated,
      ).toBe(true);
    });
  });
});

describe('useRemoveTestCaseLabel', () => {
  describe('on mutate — calls removeFromCase API', () => {
    it('calls labelsApi.removeFromCase with projectId, caseId, and labelId', async () => {
      vi.mocked(labelsApi.removeFromCase).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useRemoveTestCaseLabel('proj-1', 'suite-1', 'case-1'),
        { wrapper },
      );

      result.current.mutate('lbl-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(labelsApi.removeFromCase).toHaveBeenCalledWith(
        'proj-1',
        'case-1',
        'lbl-1',
      );
    });

    it("notifies 'Label removed' on success", async () => {
      vi.mocked(labelsApi.removeFromCase).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useRemoveTestCaseLabel('proj-1', 'suite-1', 'case-1'),
        { wrapper },
      );

      result.current.mutate('lbl-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Label removed');
    });
  });
});
