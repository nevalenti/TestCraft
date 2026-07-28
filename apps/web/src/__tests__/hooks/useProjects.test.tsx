import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/projects', () => ({
  projectQueries: {
    all: vi.fn((search?: string) => ({
      queryKey: ['projects', search],
      queryFn: vi.fn().mockResolvedValue({ items: [] }),
    })),
    detail: vi.fn((id: string) => ({
      queryKey: ['projects', id],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
  },
  projectsApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({ notify: vi.fn() }));

import { projectQueries, projectsApi } from '@/api/projects';
import { queryKeys } from '@/api/queryKeys';
import {
  useCreateProject,
  useDeleteProject,
  useProject,
  useProjects,
  useUpdateProject,
} from '@/hooks/useProjects';
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

describe('useProjects', () => {
  describe('given a search term — passes it to the query factory', () => {
    it('calls projectQueries.all with the search string', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useProjects('alpha'), { wrapper });
      expect(projectQueries.all).toHaveBeenCalledWith('alpha');
    });
  });

  describe('given no search term — calls factory with undefined', () => {
    it('calls projectQueries.all with no args', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useProjects(), { wrapper });
      expect(projectQueries.all).toHaveBeenCalledWith(undefined);
    });
  });
});

describe('useProject', () => {
  describe('given an id — calls the detail query factory', () => {
    it('calls projectQueries.detail with the id', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useProject('proj-1'), { wrapper });
      expect(projectQueries.detail).toHaveBeenCalledWith('proj-1');
    });
  });
});

describe('useCreateProject', () => {
  describe('on mutate — calls the API and notifies', () => {
    it('calls projectsApi.create with the input', async () => {
      vi.mocked(projectsApi.create).mockResolvedValue({
        id: 'p1',
        name: 'New',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateProject(), { wrapper });

      result.current.mutate({ name: 'New' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(projectsApi.create).toHaveBeenCalledWith({ name: 'New' });
    });

    it("calls notify with 'Project created' on success", async () => {
      vi.mocked(projectsApi.create).mockResolvedValue({
        id: 'p1',
        name: 'New',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateProject(), { wrapper });

      result.current.mutate({ name: 'New' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Project created');
    });
  });

  describe('on mutate failure — sets error state', () => {
    it('is in error state when the API rejects', async () => {
      vi.mocked(projectsApi.create).mockRejectedValue(
        new Error('Server error'),
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateProject(), { wrapper });

      result.current.mutate({ name: 'Fail' });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('on success — invalidates the projects list', () => {
    it('marks the projects.all cache entry as stale', async () => {
      vi.mocked(projectsApi.create).mockResolvedValue({
        id: 'p1',
        name: 'New',
      } as any);
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(queryKeys.projects.all, { items: [] });

      const { result } = renderHook(() => useCreateProject(), { wrapper });
      result.current.mutate({ name: 'New' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(
        queryClient.getQueryState(queryKeys.projects.all)?.isInvalidated,
      ).toBe(true);
    });
  });
});

describe('useUpdateProject', () => {
  describe('on mutate — calls the API with id and update payload', () => {
    it('calls projectsApi.update with the id and stripped input', async () => {
      vi.mocked(projectsApi.update).mockResolvedValue({
        id: 'p1',
        name: 'Updated',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateProject(), { wrapper });

      result.current.mutate({ id: 'p1', name: 'Updated' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(projectsApi.update).toHaveBeenCalledWith('p1', {
        name: 'Updated',
      });
    });

    it("calls notify with 'Project updated' on success", async () => {
      vi.mocked(projectsApi.update).mockResolvedValue({
        id: 'p1',
        name: 'Updated',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateProject(), { wrapper });

      result.current.mutate({ id: 'p1', name: 'Updated' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Project updated');
    });
  });

  describe('on success — invalidates both list and detail', () => {
    it('marks projects.all and projects.detail as stale', async () => {
      vi.mocked(projectsApi.update).mockResolvedValue({
        id: 'p1',
        name: 'Updated',
      } as any);
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(queryKeys.projects.all, { items: [] });
      queryClient.setQueryData(queryKeys.projects.detail('p1'), { id: 'p1' });

      const { result } = renderHook(() => useUpdateProject(), { wrapper });
      result.current.mutate({ id: 'p1', name: 'Updated' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(
        queryClient.getQueryState(queryKeys.projects.all)?.isInvalidated,
      ).toBe(true);
      expect(
        queryClient.getQueryState(queryKeys.projects.detail('p1'))
          ?.isInvalidated,
      ).toBe(true);
    });
  });

  describe('on mutate failure — sets error state', () => {
    it('is in error state when the API rejects', async () => {
      vi.mocked(projectsApi.update).mockRejectedValue(
        new Error('Server error'),
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateProject(), { wrapper });

      result.current.mutate({ id: 'p1', name: 'Fail' });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('does not invalidate cached queries', async () => {
      vi.mocked(projectsApi.update).mockRejectedValue(
        new Error('Server error'),
      );
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(queryKeys.projects.all, { items: [] });

      const { result } = renderHook(() => useUpdateProject(), { wrapper });
      result.current.mutate({ id: 'p1', name: 'Fail' });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(
        queryClient.getQueryState(queryKeys.projects.all)?.isInvalidated,
      ).toBe(false);
    });
  });
});

describe('useDeleteProject', () => {
  describe('on mutate — calls the API and notifies', () => {
    it('calls projectsApi.delete with the id', async () => {
      vi.mocked(projectsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteProject(), { wrapper });

      result.current.mutate('p1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(projectsApi.delete).toHaveBeenCalledWith('p1');
    });

    it("calls notify with 'Project deleted' on success", async () => {
      vi.mocked(projectsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteProject(), { wrapper });

      result.current.mutate('p1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Project deleted');
    });
  });

  describe('on success — removes detail and invalidates list', () => {
    it('removes the project detail from cache', async () => {
      vi.mocked(projectsApi.delete).mockResolvedValue(undefined as any);
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(queryKeys.projects.detail('p1'), { id: 'p1' });

      const { result } = renderHook(() => useDeleteProject(), { wrapper });
      result.current.mutate('p1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(
        queryClient.getQueryState(queryKeys.projects.detail('p1')),
      ).toBeUndefined();
    });

    it('marks projects.all as stale', async () => {
      vi.mocked(projectsApi.delete).mockResolvedValue(undefined as any);
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(queryKeys.projects.all, { items: [] });

      const { result } = renderHook(() => useDeleteProject(), { wrapper });
      result.current.mutate('p1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(
        queryClient.getQueryState(queryKeys.projects.all)?.isInvalidated,
      ).toBe(true);
    });
  });

  describe('on mutate failure — sets error state', () => {
    it('is in error state when the API rejects', async () => {
      vi.mocked(projectsApi.delete).mockRejectedValue(
        new Error('Server error'),
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteProject(), { wrapper });

      result.current.mutate('p1');

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('does not remove the project detail from cache', async () => {
      vi.mocked(projectsApi.delete).mockRejectedValue(
        new Error('Server error'),
      );
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(queryKeys.projects.detail('p1'), { id: 'p1' });

      const { result } = renderHook(() => useDeleteProject(), { wrapper });
      result.current.mutate('p1');

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(
        queryClient.getQueryState(queryKeys.projects.detail('p1')),
      ).not.toBeUndefined();
    });
  });
});
