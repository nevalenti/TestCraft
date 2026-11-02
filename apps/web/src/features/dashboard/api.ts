import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";

export const dashboardApi = {
  getSummary: async () => {
    const { data } = await sdk.getDashboardSummary();
    return data;
  },
};

export const dashboardQueries = {
  summary: () =>
    queryOptions({
      queryKey: queryKeys.dashboard.summary(),
      queryFn: dashboardApi.getSummary,
    }),
};
