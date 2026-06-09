import { XMarkIcon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/cn";
import { useNotificationsStore } from "@/stores/notifications";

const typeClass: Record<string, string> = {
  success: "alert alert-success",
  error: "alert alert-error",
  info: "alert alert-info",
  warning: "alert alert-warning",
};

export const Notifications = () => {
  const notifications = useNotificationsStore((store) => store.notifications);
  const remove = useNotificationsStore((store) => store.remove);

  if (notifications.length === 0) return null;

  return (
    <div
      className="toast toast-center toast-bottom z-[999]"
      style={{ bottom: "3.5rem" }}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex max-w-sm items-center gap-2.5 rounded-2xl py-2 pr-2 pl-3.5 shadow-sm",
            typeClass[notification.type] ?? "bg-base-200 text-base-content",
          )}
        >
          <span
            className="size-2.5 shrink-0 rounded-full bg-current opacity-60"
            aria-hidden="true"
          />
          <span className="flex-1 text-center text-sm font-medium">
            {notification.message}
          </span>
          <button
            onClick={() => remove(notification.id)}
            className="flex size-6 shrink-0 items-center justify-center rounded-full opacity-40 transition-colors hover:bg-current/10 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            <XMarkIcon className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};
