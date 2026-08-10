import { queryOptions } from '@tanstack/react-query';
import type {
  CreateEmailSubscription,
  CreateWebhookSubscription,
  EmailSubscription,
  WebhookSubscription,
} from '@testcraft/types';

import client from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

const WEBHOOK_BASE = (projectId: string) =>
  `projects/${projectId}/notifications/webhooks`;
const EMAIL_BASE = (projectId: string) =>
  `projects/${projectId}/notifications/emails`;

export const notificationsApi = {
  getWebhooks: async (projectId: string) => {
    const { data } = await client.get<WebhookSubscription[]>(
      WEBHOOK_BASE(projectId),
    );
    return data;
  },
  createWebhook: async (
    projectId: string,
    input: CreateWebhookSubscription,
  ) => {
    const { data } = await client.post<WebhookSubscription>(
      WEBHOOK_BASE(projectId),
      input,
    );
    return data;
  },
  deleteWebhook: (projectId: string, id: string) =>
    client.delete(`${WEBHOOK_BASE(projectId)}/${id}`),
  getEmails: async (projectId: string) => {
    const { data } = await client.get<EmailSubscription[]>(
      EMAIL_BASE(projectId),
    );
    return data;
  },
  createEmail: async (projectId: string, input: CreateEmailSubscription) => {
    const { data } = await client.post<EmailSubscription>(
      EMAIL_BASE(projectId),
      input,
    );
    return data;
  },
  deleteEmail: (projectId: string, id: string) =>
    client.delete(`${EMAIL_BASE(projectId)}/${id}`),
};

export const notificationQueries = {
  webhooks: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.notifications.webhooks(projectId),
      queryFn: () => notificationsApi.getWebhooks(projectId),
      enabled: !!projectId,
    }),
  emails: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.notifications.emails(projectId),
      queryFn: () => notificationsApi.getEmails(projectId),
      enabled: !!projectId,
    }),
};
