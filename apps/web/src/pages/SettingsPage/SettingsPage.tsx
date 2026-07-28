import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

export const SettingsPage = () => {
  useBreadcrumbs([{ label: 'Settings', href: '/settings' }]);

  return null;
};
