import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

import { NotFound } from "@/app/NotFound";
import { RootError } from "@/app/RootError";
import type { RouterContext } from "@/app/routerContext";
export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});
