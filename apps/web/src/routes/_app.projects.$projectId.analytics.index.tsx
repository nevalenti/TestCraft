import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/projects/$projectId/analytics/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/projects/$projectId/analytics/trend",
      params,
      replace: true,
    });
  },
});
