import { useNotificationsStore } from "@/stores/notifications";

export const notify = (message: string) =>
  useNotificationsStore
    .getState()
    .add({ type: "success", message, timeout: 6000 });
