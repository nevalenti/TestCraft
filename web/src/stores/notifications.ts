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

const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],

  add(notification) {
    const id = nanoid();
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    if (notification.timeout) {
      const timeoutId = setTimeout(() => {
        timeouts.delete(id);
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, notification.timeout);
      timeouts.set(id, timeoutId);
    }
  },

  remove(id) {
    const timeoutId = timeouts.get(id);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeouts.delete(id);
    }
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll() {
    timeouts.forEach((id) => clearTimeout(id));
    timeouts.clear();
    set({ notifications: [] });
  },
}));
