import { NotificationsSection } from '@/features/notifications/NotificationsSection';
import { useRequiredParam } from '@/hooks/useRequiredParam';

export const NotificationsTab = () => {
  const projectId = useRequiredParam('projectId');
  return <NotificationsSection projectId={projectId} />;
};
