import { XMarkIcon } from "@heroicons/react/24/solid";

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
          className={`flex items-center gap-2.5 rounded-2xl py-2 pl-3.5 pr-2 shadow-sm max-w-sm ${typeClass[notification.type] ?? "bg-base-200 text-base-content"}`}
        >
          <span
            className="size-2.5 rounded-full shrink-0 bg-current opacity-60"
            aria-hidden="true"
          />
          <span className="text-sm font-medium flex-1 text-center">
            {notification.message}
          </span>
          <button
            onClick={() => remove(notification.id)}
            className="size-6 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-current/10 transition-colors shrink-0"
            aria-label="Dismiss notification"
          >
            <XMarkIcon className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};
