import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

import { cn } from "@/lib/cn";
import {
  type AppNotification,
  type NotificationType,
  useNotificationsStore,
} from "@/stores/notifications";

const TYPE_STYLE: Record<
  NotificationType,
  { Icon: typeof CheckCircleIcon; iconClass: string; barClass: string }
> = {
  success: {
    Icon: CheckCircleIcon,
    iconClass: "text-success",
    barClass: "bg-success",
  },
  error: { Icon: XCircleIcon, iconClass: "text-error", barClass: "bg-error" },
  warning: {
    Icon: ExclamationTriangleIcon,
    iconClass: "text-warning",
    barClass: "bg-warning",
  },
  alert: {
    Icon: ExclamationTriangleIcon,
    iconClass: "text-warning",
    barClass: "bg-warning",
  },
  info: {
    Icon: InformationCircleIcon,
    iconClass: "text-info",
    barClass: "bg-info",
  },
};

const MAX_VISIBLE = 4;

interface ToastItemProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

const ToastItem = ({ notification, onDismiss }: ToastItemProps) => {
  const { Icon, iconClass, barClass } = TYPE_STYLE[notification.type];

  return (
    <div className="relative flex w-full items-start gap-2.5 overflow-hidden rounded-xl border border-border bg-base-100 py-3 pr-2 pl-3.5 shadow-2xl shadow-black/30 motion-safe:animate-[toast-in_180ms_ease-out] sm:w-80">
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", barClass)}
      />
      <Icon
        className={cn("mt-px size-4.5 shrink-0", iconClass)}
        aria-hidden="true"
      />
      <span className="flex-1 text-sm leading-snug font-medium text-base-content">
        {notification.message}
      </span>
      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        className="-my-1 flex size-6 shrink-0 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-base-content/8 hover:text-base-content"
        aria-label="Dismiss notification"
      >
        <XMarkIcon className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};

export const ToastStack = () => {
  const notifications = useNotificationsStore((store) => store.notifications);
  const remove = useNotificationsStore((store) => store.remove);
  const visible = notifications.slice(-MAX_VISIBLE);
  const errors = visible.filter(({ type }) => type === "error");
  const others = visible.filter(({ type }) => type !== "error");

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[999] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6">
      <div className="pointer-events-auto flex w-full flex-col gap-2 sm:w-auto">
        <div role="alert" className="flex flex-col gap-2 empty:hidden">
          {errors.map((notification) => (
            <ToastItem
              key={notification.id}
              notification={notification}
              onDismiss={remove}
            />
          ))}
        </div>
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col gap-2 empty:hidden"
        >
          {others.map((notification) => (
            <ToastItem
              key={notification.id}
              notification={notification}
              onDismiss={remove}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
