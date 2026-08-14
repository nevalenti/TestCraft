import { XMarkIcon } from '@heroicons/react/24/solid';

import { useCookieConsent } from '@/hooks/useCookieConsent';
import { cn } from '@/lib/cn';
import { useNotificationsStore } from '@/stores/notifications';

const typeConfig: Record<string, { cls: string; dismissCls: string }> = {
  success: {
    cls: 'bg-success text-success-content shadow-lg',
    dismissCls:
      'text-success-content/70 hover:bg-success-content/15 hover:text-success-content',
  },
  error: {
    cls: 'bg-error text-error-content shadow-lg',
    dismissCls:
      'text-error-content/70 hover:bg-error-content/15 hover:text-error-content',
  },
  info: {
    cls: 'bg-info text-info-content shadow-lg',
    dismissCls:
      'text-info-content/70 hover:bg-info-content/15 hover:text-info-content',
  },
  warning: {
    cls: 'bg-warning text-warning-content shadow-lg',
    dismissCls:
      'text-warning-content/70 hover:bg-warning-content/15 hover:text-warning-content',
  },
};

const MAX_VISIBLE = 4;

export const ToastStack = () => {
  const notifications = useNotificationsStore((store) => store.notifications);
  const remove = useNotificationsStore((store) => store.remove);
  const { isShowing: isCookieBannerShowing } = useCookieConsent();

  if (notifications.length === 0) return null;

  return (
    <div
      className={cn(
        'toast toast-center toast-bottom z-[999]',
        isCookieBannerShowing ? 'mb-28 sm:mb-36 md:mb-44' : 'mb-2',
      )}
    >
      {notifications.slice(-MAX_VISIBLE).map((notification) => {
        const config = typeConfig[notification.type];

        return (
          <div
            key={notification.id}
            className={cn(
              'flex max-w-sm items-center gap-2.5 rounded-xl py-2.5 pr-2 pl-3.5',
              config?.cls ?? 'bg-base-200 text-base-content shadow-lg',
            )}
          >
            <span className="flex-1 text-sm font-medium">
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
  );
};
