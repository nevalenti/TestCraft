import type { QueryClient, QueryKey } from "@tanstack/react-query";

export const findCached = <T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  id: string,
) => queryClient.getQueryData<T[]>(queryKey)?.find((item) => item.id === id);
