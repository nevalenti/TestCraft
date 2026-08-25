import { notify } from '@/lib/notify';

const NOTIFY_COOLDOWN_MS = 5000;

export const installGlobalErrorHandlers = () => {
  let lastNotifiedAt = 0;

  const notifyOnce = (message: string) => {
    const now = Date.now();
    if (now - lastNotifiedAt < NOTIFY_COOLDOWN_MS) return;
    lastNotifiedAt = now;
    notify(message, 'error');
  };

  addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error ?? event.message);
    notifyOnce('Something went wrong. Please try again.');
  });

  addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    notifyOnce('Something went wrong. Please try again.');
  });
};
