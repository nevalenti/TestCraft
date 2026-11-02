import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { testResultQueries } from "@/features/testResults/api";

export const useResultFeed = (projectId: string, runId: string) => {
  const { data: page, isLoading } = useQuery(
    testResultQueries.feed(projectId, runId),
  );

  const items = useMemo(() => (page?.items ?? []).toReversed(), [page]);

  return { items, isLoading };
};
