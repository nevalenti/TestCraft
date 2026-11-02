import { EmailsSection } from "@/features/notifications/EmailsSection";
import { WebhooksSection } from "@/features/notifications/WebhooksSection";

export const NotificationsSection = ({ projectId }: { projectId: string }) => (
  <div className="space-y-5">
    <WebhooksSection projectId={projectId} />
    <EmailsSection projectId={projectId} />
  </div>
);
