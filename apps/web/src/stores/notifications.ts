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

  const dismiss = (id: string) => {
    timers.delete(id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  };

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
      const timer = timers.get(id);

      if (timer) clearTimeout(timer);
      dismiss(id);
    },

    clearAll: () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      set({ notifications: [] });
    },
  };
});
