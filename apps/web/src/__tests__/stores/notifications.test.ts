import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNotificationsStore } from "@/stores/notifications";

beforeEach(() => {
  useNotificationsStore.getState().clearAll();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useNotificationsStore", () => {
  describe("add — given a notification — appends it to the list", () => {
    it("increases the notification count by one", () => {
      useNotificationsStore
        .getState()
        .add({ type: "success", message: "Saved!" });
      expect(useNotificationsStore.getState().notifications).toHaveLength(1);
    });

    it("stores the correct message and type", () => {
      useNotificationsStore
        .getState()
        .add({ type: "error", message: "Failed" });
      const [n] = useNotificationsStore.getState().notifications;

      expect(n.message).toBe("Failed");
      expect(n.type).toBe("error");
    });

    it("assigns a unique id to each notification", () => {
      useNotificationsStore.getState().add({ type: "info", message: "A" });
      useNotificationsStore.getState().add({ type: "info", message: "B" });
      const ids = useNotificationsStore
        .getState()
        .notifications.map((notification) => notification.id);

      expect(new Set(ids).size).toBe(2);
    });
  });

  describe("add — given a timeout — auto-dismisses after the delay", () => {
    it("removes the notification after the specified milliseconds", () => {
      vi.useFakeTimers();

      useNotificationsStore
        .getState()
        .add({ type: "success", message: "Auto-gone", timeout: 3000 });
      expect(useNotificationsStore.getState().notifications).toHaveLength(1);

      vi.advanceTimersByTime(3000);
      expect(useNotificationsStore.getState().notifications).toHaveLength(0);
    });

    it("does not remove the notification before the timeout elapses", () => {
      vi.useFakeTimers();

      useNotificationsStore
        .getState()
        .add({ type: "success", message: "Still here", timeout: 5000 });

      vi.advanceTimersByTime(4999);
      expect(useNotificationsStore.getState().notifications).toHaveLength(1);
    });
  });

  describe("remove — given a valid id — removes that notification", () => {
    it("decreases the count by one", () => {
      useNotificationsStore.getState().add({ type: "info", message: "One" });
      useNotificationsStore.getState().add({ type: "info", message: "Two" });
      const { notifications } = useNotificationsStore.getState();

      useNotificationsStore.getState().remove(notifications[0].id);
      expect(useNotificationsStore.getState().notifications).toHaveLength(1);
    });

    it("leaves the other notifications in place", () => {
      useNotificationsStore.getState().add({ type: "info", message: "Keep" });
      useNotificationsStore
        .getState()
        .add({ type: "info", message: "Remove me" });
      const { notifications } = useNotificationsStore.getState();
      const removeId = notifications.find(
        (notification) => notification.message === "Remove me",
      )!.id;

      useNotificationsStore.getState().remove(removeId);

      const remaining = useNotificationsStore.getState().notifications;

      expect(remaining).toHaveLength(1);
      expect(remaining[0].message).toBe("Keep");
    });
  });

  describe("remove — given a pending timeout — cancels it so the notification does not reappear", () => {
    it("does not trigger the timeout callback after manual removal", () => {
      vi.useFakeTimers();

      useNotificationsStore.getState().add({
        type: "success",
        message: "Manually dismissed",
        timeout: 3000,
      });
      const { notifications } = useNotificationsStore.getState();

      useNotificationsStore.getState().remove(notifications[0].id);

      vi.advanceTimersByTime(3000);
      expect(useNotificationsStore.getState().notifications).toHaveLength(0);
    });
  });

  describe("clearAll — given multiple notifications — empties the list", () => {
    it("sets notifications to an empty array", () => {
      useNotificationsStore.getState().add({ type: "info", message: "A" });
      useNotificationsStore.getState().add({ type: "info", message: "B" });
      useNotificationsStore.getState().add({ type: "info", message: "C" });

      useNotificationsStore.getState().clearAll();

      expect(useNotificationsStore.getState().notifications).toHaveLength(0);
    });
  });
});
