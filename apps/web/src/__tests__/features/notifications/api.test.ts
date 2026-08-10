import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import client from '@/api/client';
import { notificationsApi } from '@/features/notifications/api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('notificationsApi webhooks', () => {
  it('getWebhooks fetches the webhook list', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await notificationsApi.getWebhooks('p1');

    expect(client.get).toHaveBeenCalledWith(
      'projects/p1/notifications/webhooks',
    );
  });

  it('createWebhook posts under the webhooks path, not the emails path', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: 'w1' } });

    await notificationsApi.createWebhook('p1', { url: 'https://x' } as any);

    expect(client.post).toHaveBeenCalledWith(
      'projects/p1/notifications/webhooks',
      { url: 'https://x' },
    );
  });

  it('deleteWebhook removes the webhook by id', () => {
    notificationsApi.deleteWebhook('p1', 'w1');

    expect(client.delete).toHaveBeenCalledWith(
      'projects/p1/notifications/webhooks/w1',
    );
  });
});

describe('notificationsApi emails', () => {
  it('getEmails fetches the email subscription list', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await notificationsApi.getEmails('p1');

    expect(client.get).toHaveBeenCalledWith('projects/p1/notifications/emails');
  });

  it('createEmail posts under the emails path, not the webhooks path', async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: 'e1' } });

    await notificationsApi.createEmail('p1', {
      email: 'a@b.com',
    } as any);

    expect(client.post).toHaveBeenCalledWith(
      'projects/p1/notifications/emails',
      { email: 'a@b.com' },
    );
  });

  it('deleteEmail removes the email subscription by id', () => {
    notificationsApi.deleteEmail('p1', 'e1');

    expect(client.delete).toHaveBeenCalledWith(
      'projects/p1/notifications/emails/e1',
    );
  });
});
