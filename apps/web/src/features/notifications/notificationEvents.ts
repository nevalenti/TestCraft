import { NotificationEvent } from "@testcraft/types";

export const AVAILABLE_EVENTS = Object.values(NotificationEvent);

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEvent, string> = {
  [NotificationEvent.RunCompleted]: "Run completed",
};
