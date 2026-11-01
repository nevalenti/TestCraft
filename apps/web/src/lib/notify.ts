import {
  type NotificationType,
  useNotificationsStore,
} from "@/stores/notifications";

export const notify = (message: string, type: NotificationType = "success") =>
  useNotificationsStore.getState().add({ type, message, timeout: 6000 });
