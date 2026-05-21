import { XMarkIcon } from "@heroicons/react/24/outline";

import { useNotificationsStore } from "@/stores/notifications";

const alertClass: Record<string, string> = {
  success: "alert-success",
  error: "alert-error",
  info: "alert-info",
  warning: "alert-warning",
};

const btnClass: Record<string, string> = {
  success: "btn-success",
  error: "btn-error",
  info: "btn-info",
  warning: "btn-warning",
};

export const Notifications = () => {
  const notifications = useNotificationsStore((s) => s.notifications);
  const remove = useNotificationsStore((s) => s.remove);

  if (notifications.length === 0) return null;

  return (
    <div className="toast toast-center toast-top z-[999]">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`alert flex justify-between gap-4 shadow-lg ${alertClass[n.type] ?? ""}`}
        >
          <span>{n.message}</span>
          <button
            onClick={() => remove(n.id)}
            className={`btn btn-active btn-sm btn-square ${btnClass[n.type] ?? ""}`}
            aria-label="Dismiss notification"
          >
            <XMarkIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};
