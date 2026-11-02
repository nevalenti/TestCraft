import { getRouteApi } from "@tanstack/react-router";

import { MembersSection } from "@/features/projectMembers/MembersSection";

const routeApi = getRouteApi("/_app/projects/$projectId/settings/members");

export const MembersTab = () => {
  const { projectId } = routeApi.useParams();
  return <MembersSection projectId={projectId} />;
};
