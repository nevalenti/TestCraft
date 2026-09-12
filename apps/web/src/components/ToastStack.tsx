import { XMarkIcon } from '@heroicons/react/24/solid';

import { cn } from '@/lib/cn';
import { useNotificationsStore } from '@/stores/notifications';

const typeConfig: Record<
  string,
  { cls: string; textCls: string; dismissCls: string }
> = {
  success: {
    cls: 'border-success/40 bg-base-100 border shadow-lg',
    textCls: 'text-success',
    dismissCls: 'text-success/70 hover:bg-success/10 hover:text-success',
  },
  error: {
    cls: 'border-error/40 bg-base-100 border shadow-lg',
    textCls: 'text-error',
    dismissCls: 'text-error/70 hover:bg-error/10 hover:text-error',
  },
  info: {
    cls: 'border-info/40 bg-base-100 border shadow-lg',
    textCls: 'text-info',
    dismissCls: 'text-info/70 hover:bg-info/10 hover:text-info',
  },
  warning: {
    cls: 'border-warning/40 bg-base-100 border shadow-lg',
    textCls: 'text-warning',
    dismissCls: 'text-warning/70 hover:bg-warning/10 hover:text-warning',
  },
};

const MAX_VISIBLE = 4;

export const ToastStack = () => {
  const notifications = useNotificationsStore((store) => store.notifications);
  const remove = useNotificationsStore((store) => store.remove);

  if (notifications.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[999] mx-auto flex max-w-360 justify-center px-4 sm:bottom-20">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex flex-col gap-2"
      >
        {notifications.slice(-MAX_VISIBLE).map((notification) => {
          const config = typeConfig[notification.type];

          return (
            <div
              key={notification.id}
              className={cn(
                'flex max-w-sm items-center gap-2.5 rounded-xl py-2.5 pr-2 pl-3.5',
                config?.cls ?? 'border border-border bg-base-100 shadow-lg',
              )}
            >
              <span
                className={cn(
                  'flex-1 text-sm font-medium',
                  config?.textCls ?? 'text-base-content',
                )}
              >
                {notification.message}
              </span>
              <button
                onClick={() => remove(notification.id)}
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors',
                  config?.dismissCls ??
                    'text-base-content/60 hover:bg-base-200 hover:text-base-content/85',
                )}
                aria-label="Dismiss notification"
              >
                <XMarkIcon className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
