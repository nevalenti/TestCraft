import type { components } from "./generated/schema.js";

export type WebhookSubscription =
  components["schemas"]["TestCraft.Application.Notifications.WebhookSubscriptionResponse"];
export type EmailSubscription =
  components["schemas"]["TestCraft.Application.Notifications.EmailSubscriptionResponse"];

// `projectId` is bound from the route, not supplied by the client.
export type CreateWebhookSubscription = Omit<
  components["schemas"]["TestCraft.Application.Notifications.CreateWebhookSubscription.Command"],
  "projectId"
>;
export type UpdateWebhookSubscription = Omit<
  components["schemas"]["TestCraft.Application.Notifications.UpdateWebhookSubscription.Command"],
  "projectId"
>;
export type CreateEmailSubscription =
  components["schemas"]["TestCraft.Application.Notifications.CreateEmailSubscription.Command"];
export type UpdateEmailSubscription =
  components["schemas"]["TestCraft.Application.Notifications.UpdateEmailSubscription.Command"];
