import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { notifyMutationError } from "@/app/notifyMutationError";
import { refetchOnConflict } from "@/app/refetchOnConflict";
import { retryQuery } from "@/app/retryQuery";
import { router } from "@/app/router";
import { AuthProvider } from "@/auth/AuthProvider";

const queryClient: QueryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      notifyMutationError(error, mutation.meta?.silentErrors);
      return refetchOnConflict(queryClient, error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: retryQuery,
    },
  },
});

export const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ queryClient }} />
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
      {import.meta.env.DEV && (
        <TanStackRouterDevtools
          router={router}
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  </AuthProvider>
);
