import { EmailsSection } from '@/pages/ProjectDetailPage/EmailsSection';
import { WebhooksSection } from '@/pages/ProjectDetailPage/WebhooksSection';

export const NotificationsSection = ({ projectId }: { projectId: string }) => (
  <div className="space-y-8">
    <WebhooksSection projectId={projectId} />
    <EmailsSection projectId={projectId} />
  </div>
);
