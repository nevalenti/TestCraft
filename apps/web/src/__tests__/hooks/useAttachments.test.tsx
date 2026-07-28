import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/attachments', () => ({
  attachmentQueries: {
    all: vi.fn((projectId: string, runId: string, resultId: string) => ({
      queryKey: [
        'projects',
        projectId,
        'runs',
        runId,
        'results',
        resultId,
        'attachments',
      ],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
  },
  attachmentsApi: {
    upload: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({ notify: vi.fn() }));

import { attachmentQueries, attachmentsApi } from '@/api/attachments';
import {
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from '@/hooks/useAttachments';
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

describe('useAttachments', () => {
  describe('given projectId, runId, resultId — calls the query factory', () => {
    it('calls attachmentQueries.all with all three ids', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useAttachments('proj-1', 'run-1', 'result-1'), {
        wrapper,
      });
      expect(attachmentQueries.all).toHaveBeenCalledWith(
        'proj-1',
        'run-1',
        'result-1',
      );
    });
  });
});

describe('useUploadAttachment', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls attachmentsApi.upload with projectId, runId, resultId, and file', async () => {
      vi.mocked(attachmentsApi.upload).mockResolvedValue({
        id: 'att-1',
        fileName: 'screenshot.png',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useUploadAttachment('proj-1', 'run-1', 'result-1'),
        { wrapper },
      );

      const file = new File(['data'], 'screenshot.png', {
        type: 'image/png',
      });
      result.current.mutate(file);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(attachmentsApi.upload).toHaveBeenCalledWith(
        'proj-1',
        'run-1',
        'result-1',
        file,
      );
    });

    it("notifies 'Attachment uploaded' on success", async () => {
      vi.mocked(attachmentsApi.upload).mockResolvedValue({
        id: 'att-1',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useUploadAttachment('proj-1', 'run-1', 'result-1'),
        { wrapper },
      );

      result.current.mutate(
        new File(['data'], 'log.txt', { type: 'text/plain' }),
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Attachment uploaded');
    });
  });
});

describe('useDeleteAttachment', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls attachmentsApi.delete with all ids', async () => {
      vi.mocked(attachmentsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useDeleteAttachment('proj-1', 'run-1', 'result-1'),
        { wrapper },
      );

      result.current.mutate('att-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(attachmentsApi.delete).toHaveBeenCalledWith(
        'proj-1',
        'run-1',
        'result-1',
        'att-1',
      );
    });

    it("notifies 'Attachment deleted' on success", async () => {
      vi.mocked(attachmentsApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useDeleteAttachment('proj-1', 'run-1', 'result-1'),
        { wrapper },
      );

      result.current.mutate('att-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Attachment deleted');
    });
  });
});
