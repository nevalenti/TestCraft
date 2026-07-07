import { XMarkIcon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/cn";
import { useNotificationsStore } from "@/stores/notifications";

const typeConfig: Record<string, { cls: string; dotCls: string }> = {
  success: {
    cls: "bg-base-100 border border-success/25 text-base-content shadow-lg",
    dotCls: "bg-success",
  },
  error: {
    cls: "bg-base-100 border border-error/25 text-base-content shadow-lg",
    dotCls: "bg-error",
  },
  info: {
    cls: "bg-base-100 border border-info/25 text-base-content shadow-lg",
    dotCls: "bg-info",
  },
  warning: {
    cls: "bg-base-100 border border-warning/25 text-base-content shadow-lg",
    dotCls: "bg-warning",
  },
};

const MAX_VISIBLE = 4;

export const Notifications = () => {
  const notifications = useNotificationsStore((store) => store.notifications);
  const remove = useNotificationsStore((store) => store.remove);

  if (notifications.length === 0) return null;

  return (
    <div
      className="toast toast-center toast-bottom z-[999]"
      style={{ bottom: "11rem" }}
    >
      {notifications.slice(-MAX_VISIBLE).map((notification) => {
        const config = typeConfig[notification.type];

        return (
          <div
            key={notification.id}
            className={cn(
              "flex max-w-sm items-center gap-2.5 rounded-xl py-2.5 pr-2 pl-3.5",
              config?.cls ??
                "bg-base-200 text-base-content border border-border shadow-lg",
            )}
          >
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                config?.dotCls ?? "bg-base-content/40",
              )}
              aria-hidden="true"
            />
            <span className="flex-1 text-sm font-medium">
              {notification.message}
            </span>
            <button
              onClick={() => remove(notification.id)}
              className="flex size-6 shrink-0 items-center justify-center rounded-lg text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content/85"
              aria-label="Dismiss notification"
            >
              <XMarkIcon className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
