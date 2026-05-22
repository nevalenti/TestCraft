import { XMarkIcon } from "@heroicons/react/24/solid";

import { useNotificationsStore } from "@/stores/notifications";

const dotClass: Record<string, string> = {
  success: "bg-success",
  error: "bg-error",
  info: "bg-info",
  warning: "bg-warning",
};

export const Notifications = () => {
  const notifications = useNotificationsStore((s) => s.notifications);
  const remove = useNotificationsStore((s) => s.remove);

  if (notifications.length === 0) return null;

  return (
    <div
      className="toast toast-center toast-top z-[999]"
      style={{ top: "3.5rem" }}
    >
      {notifications.map((n) => (
        <div
          key={n.id}
          className="flex items-center gap-2.5 bg-neutral text-neutral-content rounded-full py-2 pl-3.5 pr-2 shadow-lg max-w-xs"
        >
          <span
            className={`size-2.5 rounded-full shrink-0 ${dotClass[n.type] ?? "bg-neutral-content/50"}`}
            aria-hidden="true"
          />
          <span className="text-sm font-medium flex-1 whitespace-nowrap">
            {n.message}
          </span>
          <button
            onClick={() => remove(n.id)}
            className="size-6 rounded-full flex items-center justify-center text-neutral-content/40 hover:text-neutral-content hover:bg-white/10 transition-colors shrink-0"
            aria-label="Dismiss notification"
          >
            <XMarkIcon className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};
