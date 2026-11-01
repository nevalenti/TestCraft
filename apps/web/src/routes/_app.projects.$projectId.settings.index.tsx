import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/projects/$projectId/settings/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/projects/$projectId/settings/tokens",
      params,
      replace: true,
    });
  },
});
