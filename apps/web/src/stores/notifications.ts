import { produce } from "immer";
import { nanoid } from "nanoid";
import { create } from "zustand";

export type NotificationType =
  | "alert"
  | "success"
  | "error"
  | "info"
  | "warning";

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  timeout?: number;
}

interface NotificationsState {
  notifications: AppNotification[];
  add: (notification: Omit<AppNotification, "id">) => void;
  remove: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const cancel = (id: string) => {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
  };

  const dismiss = (id: string) =>
    set(
      produce<NotificationsState>((draft) => {
        const index = draft.notifications.findIndex(
          (notification) => notification.id === id,
        );
        if (index !== -1) draft.notifications.splice(index, 1);
      }),
    );

  return {
    notifications: [],

    add: (notification) => {
      const id = nanoid();
      set(
        produce<NotificationsState>((draft) => {
          draft.notifications.push({ ...notification, id });
        }),
      );
      if (notification.timeout) {
        timers.set(
          id,
          setTimeout(() => dismiss(id), notification.timeout),
        );
      }
    },

    remove: (id) => {
      cancel(id);
      dismiss(id);
    },

    clearAll: () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      set(
        produce<NotificationsState>((draft) => {
          draft.notifications = [];
        }),
      );
    },
  };
});
