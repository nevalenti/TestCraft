import type { components } from "./generated/schema.js";

export type WebhookSubscription =
  components["schemas"]["WebhookSubscriptionResponse"];
export type EmailSubscription =
  components["schemas"]["EmailSubscriptionResponse"];

export type CreateWebhookSubscription = Omit<
  components["schemas"]["CreateWebhookSubscriptionRequest"],
  "projectId"
>;
export type UpdateWebhookSubscription = Omit<
  components["schemas"]["UpdateWebhookSubscriptionRequest"],
  "projectId"
>;
export type CreateEmailSubscription =
  components["schemas"]["CreateEmailSubscriptionRequest"];
export type UpdateEmailSubscription =
  components["schemas"]["UpdateEmailSubscriptionRequest"];
