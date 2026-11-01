import { createRouter } from "@tanstack/react-router";

import { RouteError } from "@/app/RouteError";
import { LoadingFallback } from "@/layout/LoadingFallback";
import { routeTree } from "@/routeTree.gen";
export const router = createRouter({
  routeTree,
  context: { queryClient: undefined! },
  defaultPendingComponent: LoadingFallback,
  defaultErrorComponent: RouteError,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
