import { queryOptions } from "@tanstack/react-query";
import type {
  CreateEmailSubscription,
  CreateWebhookSubscription,
} from "@testcraft/types";

import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";

export const notificationsApi = {
  getWebhooks: async (projectId: string) => {
    const { data } = await sdk.listWebhookSubscriptions({
      path: { project_id: projectId },
    });
    return data;
  },
  createWebhook: async (
    projectId: string,
    input: CreateWebhookSubscription,
  ) => {
    const { data } = await sdk.createWebhookSubscription({
      path: { project_id: projectId },
      body: input,
    });
    return data;
  },
  deleteWebhook: (projectId: string, id: string) =>
    sdk.deleteWebhookSubscription({
      path: { project_id: projectId, subscription_id: id },
    }),
  getEmails: async (projectId: string) => {
    const { data } = await sdk.listEmailSubscriptions({
      path: { project_id: projectId },
    });
    return data;
  },
  createEmail: async (projectId: string, input: CreateEmailSubscription) => {
    const { data } = await sdk.createEmailSubscription({
      path: { project_id: projectId },
      body: input,
    });
    return data;
  },
  deleteEmail: (projectId: string, id: string) =>
    sdk.deleteEmailSubscription({
      path: { project_id: projectId, subscription_id: id },
    }),
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
