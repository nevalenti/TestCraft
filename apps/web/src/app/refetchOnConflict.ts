import type { QueryClient } from "@tanstack/react-query";

import { isPreconditionFailed } from "@/api/ifMatch";

export const refetchOnConflict = async (
  queryClient: QueryClient,
  error: unknown,
) => {
  if (isPreconditionFailed(error)) await queryClient.invalidateQueries();
};
