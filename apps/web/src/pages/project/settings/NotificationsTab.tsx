import { getRouteApi } from "@tanstack/react-router";

import { NotificationsSection } from "@/features/notifications/NotificationsSection";

const routeApi = getRouteApi(
  "/_app/projects/$projectId/settings/notifications",
);

export const NotificationsTab = () => {
  const { projectId } = routeApi.useParams();
  return <NotificationsSection projectId={projectId} />;
};
