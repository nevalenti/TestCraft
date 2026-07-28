import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateEmailSubscription,
  CreateWebhookSubscription,
  UpdateEmailSubscription,
  UpdateWebhookSubscription,
} from '@testcraft/types';

import { notificationQueries, notificationsApi } from '@/api/notifications';
import { queryKeys } from '@/api/queryKeys';
import { notify } from '@/lib/notify';

export const useWebhooks = (projectId: string) =>
  useQuery(notificationQueries.webhooks(projectId));

export const useCreateWebhook = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWebhookSubscription) =>
      notificationsApi.createWebhook(projectId, input),
    onSuccess: () => {
      notify('Webhook added');
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.webhooks(projectId),
      });
    },
  });
};

export const useUpdateWebhook = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: UpdateWebhookSubscription & { id: string }) =>
      notificationsApi.updateWebhook(projectId, id, input),
    onSuccess: () => {
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
    onSuccess: () => {
      notify('Webhook removed');
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
    onSuccess: () => {
      notify('Email subscription added');
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.emails(projectId),
      });
    },
  });
};

export const useUpdateEmail = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateEmailSubscription & { id: string }) =>
      notificationsApi.updateEmail(projectId, id, input),
    onSuccess: () => {
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
    onSuccess: () => {
      notify('Email subscription removed');
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.emails(projectId),
      });
    },
  });
};
