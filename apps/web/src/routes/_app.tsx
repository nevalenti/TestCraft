import { createFileRoute } from "@tanstack/react-router";

import { NotFound } from "@/app/NotFound";
import { keycloak } from "@/auth/keycloak";
import { AppLayout } from "@/layout/AppLayout";
export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (keycloak.authenticated) return;
    await keycloak.login();
    await new Promise(() => {});
  },
  component: AppLayout,
  notFoundComponent: NotFound,
});
