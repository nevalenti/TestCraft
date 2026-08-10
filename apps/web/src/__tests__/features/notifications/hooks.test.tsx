import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/notifications/api', () => ({
  notificationQueries: {
    webhooks: vi.fn((projectId: string) => ({
      queryKey: ['projects', projectId, 'notifications', 'webhooks'],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
    emails: vi.fn((projectId: string) => ({
      queryKey: ['projects', projectId, 'notifications', 'emails'],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
  },
  notificationsApi: {
    createWebhook: vi.fn(),
    deleteWebhook: vi.fn(),
    createEmail: vi.fn(),
    deleteEmail: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({ notify: vi.fn() }));

import {
  notificationQueries,
  notificationsApi,
} from '@/features/notifications/api';
import {
  useCreateEmail,
  useCreateWebhook,
  useDeleteEmail,
  useDeleteWebhook,
  useEmails,
  useWebhooks,
} from '@/features/notifications/hooks';
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

describe('useWebhooks', () => {
  describe('given a projectId — calls the webhook query factory', () => {
    it('calls notificationQueries.webhooks with the projectId', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useWebhooks('proj-1'), { wrapper });
      expect(notificationQueries.webhooks).toHaveBeenCalledWith('proj-1');
    });
  });
});

describe('useEmails', () => {
  describe('given a projectId — calls the email query factory', () => {
    it('calls notificationQueries.emails with the projectId', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useEmails('proj-1'), { wrapper });
      expect(notificationQueries.emails).toHaveBeenCalledWith('proj-1');
    });
  });
});

describe('useCreateWebhook', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls notificationsApi.createWebhook with projectId and input', async () => {
      vi.mocked(notificationsApi.createWebhook).mockResolvedValue({
        id: 'wh-1',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateWebhook('proj-1'), {
        wrapper,
      });

      const input = {
        url: 'https://example.com/hook',
        events: 'run.completed',
      };
      result.current.mutate(input as any);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notificationsApi.createWebhook).toHaveBeenCalledWith(
        'proj-1',
        input,
      );
    });

    it("notifies 'Webhook added' on success", async () => {
      vi.mocked(notificationsApi.createWebhook).mockResolvedValue({
        id: 'wh-1',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateWebhook('proj-1'), {
        wrapper,
      });

      result.current.mutate({
        url: 'https://example.com/hook',
        events: 'run.completed',
      } as any);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Webhook added');
    });
  });
});

describe('useDeleteWebhook', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls notificationsApi.deleteWebhook with projectId and webhookId', async () => {
      vi.mocked(notificationsApi.deleteWebhook).mockResolvedValue(
        undefined as any,
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteWebhook('proj-1'), {
        wrapper,
      });

      result.current.mutate('wh-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notificationsApi.deleteWebhook).toHaveBeenCalledWith(
        'proj-1',
        'wh-1',
      );
    });

    it("notifies 'Webhook removed' on success", async () => {
      vi.mocked(notificationsApi.deleteWebhook).mockResolvedValue(
        undefined as any,
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteWebhook('proj-1'), {
        wrapper,
      });

      result.current.mutate('wh-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Webhook removed');
    });
  });
});

describe('useCreateEmail', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls notificationsApi.createEmail with projectId and input', async () => {
      vi.mocked(notificationsApi.createEmail).mockResolvedValue({
        id: 'em-1',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateEmail('proj-1'), {
        wrapper,
      });

      result.current.mutate({
        email: 'user@example.com',
        events: 'run.completed',
      } as any);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notificationsApi.createEmail).toHaveBeenCalledWith('proj-1', {
        email: 'user@example.com',
        events: 'run.completed',
      });
    });

    it("notifies 'Email subscription added' on success", async () => {
      vi.mocked(notificationsApi.createEmail).mockResolvedValue({
        id: 'em-1',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateEmail('proj-1'), {
        wrapper,
      });

      result.current.mutate({
        email: 'user@example.com',
        events: 'run.completed',
      } as any);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Email subscription added');
    });
  });
});

describe('useDeleteEmail', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls notificationsApi.deleteEmail with projectId and emailId', async () => {
      vi.mocked(notificationsApi.deleteEmail).mockResolvedValue(
        undefined as any,
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteEmail('proj-1'), {
        wrapper,
      });

      result.current.mutate('em-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notificationsApi.deleteEmail).toHaveBeenCalledWith(
        'proj-1',
        'em-1',
      );
    });

    it("notifies 'Email subscription removed' on success", async () => {
      vi.mocked(notificationsApi.deleteEmail).mockResolvedValue(
        undefined as any,
      );
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteEmail('proj-1'), {
        wrapper,
      });

      result.current.mutate('em-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Email subscription removed');
    });
  });
});
