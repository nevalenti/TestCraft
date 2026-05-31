import { XMarkIcon } from "@heroicons/react/24/solid";

import { useNotificationsStore } from "@/stores/notifications";

const typeClass: Record<string, string> = {
  success: "alert alert-soft alert-success",
  error: "alert alert-soft alert-error",
  info: "alert alert-soft alert-info",
  warning: "alert alert-soft alert-warning",
};

export const Notifications = () => {
  const notifications = useNotificationsStore((s) => s.notifications);
  const remove = useNotificationsStore((s) => s.remove);

  if (notifications.length === 0) return null;

  return (
    <div
      className="toast toast-center toast-bottom z-[999]"
      style={{ bottom: "3.5rem" }}
    >
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-center gap-2.5 rounded-full py-2 pl-3.5 pr-2 shadow-sm max-w-xs ${typeClass[n.type] ?? "bg-base-200 text-base-content"}`}
        >
          <span
            className="size-2.5 rounded-full shrink-0 bg-current opacity-60"
            aria-hidden="true"
          />
          <span className="text-sm font-medium flex-1 whitespace-nowrap">
            {n.message}
          </span>
          <button
            onClick={() => remove(n.id)}
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
