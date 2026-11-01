import { getRouteApi } from "@tanstack/react-router";

import { ApiTokensSection } from "@/features/apiTokens/ApiTokensSection";

const routeApi = getRouteApi("/_app/projects/$projectId/settings/tokens");

export const ApiTokensTab = () => {
  const { projectId } = routeApi.useParams();
  return <ApiTokensSection projectId={projectId} />;
};
