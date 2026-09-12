import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateEmailSubscription,
  CreateWebhookSubscription,
  EmailSubscription,
  WebhookSubscription,
} from '@testcraft/types';

import { queryKeys } from '@/api/queryKeys';
import {
  notificationQueries,
  notificationsApi,
} from '@/features/notifications/api';
import { notify } from '@/lib/notify';

export const useWebhooks = (projectId: string) =>
  useQuery(notificationQueries.webhooks(projectId));

export const useCreateWebhook = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWebhookSubscription) =>
      notificationsApi.createWebhook(projectId, input),
    onSuccess: (_, input) => {
      notify(`Webhook "${input.url}" added`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.webhooks(projectId),
      });
    },
  });
};

export const useDeleteWebhook = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteWebhook(projectId, id),
    onSuccess: (_, id) => {
      const url = queryClient
        .getQueryData<
          WebhookSubscription[]
        >(queryKeys.notifications.webhooks(projectId))
        ?.find((webhook) => webhook.id === id)?.url;
      notify(url ? `Webhook "${url}" removed` : 'Webhook removed');
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.webhooks(projectId),
      });
    },
  });
};

export const useEmails = (projectId: string) =>
  useQuery(notificationQueries.emails(projectId));

export const useCreateEmail = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmailSubscription) =>
      notificationsApi.createEmail(projectId, input),
    onSuccess: (_, input) => {
      notify(`Email subscription added for ${input.email}`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.emails(projectId),
      });
    },
  });
};

export const useDeleteEmail = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteEmail(projectId, id),
    onSuccess: (_, id) => {
      const email = queryClient
        .getQueryData<
          EmailSubscription[]
        >(queryKeys.notifications.emails(projectId))
        ?.find((subscription) => subscription.id === id)?.email;
      notify(
        email
          ? `Email subscription removed for ${email}`
          : 'Email subscription removed',
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.emails(projectId),
      });
    },
  });
};
