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
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));

  return {
    notifications: [],

    add: (notification) => {
      const id = nanoid();
      set((state) => ({
        notifications: [...state.notifications, { ...notification, id }],
      }));
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
      set({ notifications: [] });
    },
  };
});
