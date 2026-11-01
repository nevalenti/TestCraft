import { useNavigate, useSearch } from "@tanstack/react-router";
import type { TestResultStatus } from "@testcraft/types";
import { useEffect, useRef, useState } from "react";

import { useDebounce } from "@/hooks/useDebounce";
import type { RunPageSearch } from "@/pages/run/runPageSearch";

const RUN_ROUTE_ID = "/_app/projects/$projectId_/runs/$runId";
const RUN_ROUTE_PATH = "/projects/$projectId/runs/$runId";

export const useRunPageSearch = (onFiltersChange: () => void) => {
  const urlSearch = useSearch({ from: RUN_ROUTE_ID });
  const navigate = useNavigate({ from: RUN_ROUTE_PATH });
  const [search, setSearch] = useState(urlSearch.q ?? "");
  const debouncedSearch = useDebounce(search, 300);
  const [appliedSearch, setAppliedSearch] = useState(debouncedSearch);

  const updateUrlSearch = (next: RunPageSearch) =>
    void navigate({
      search: (previous) => ({ ...previous, ...next }),
      replace: true,
    });

  if (appliedSearch !== debouncedSearch) {
    setAppliedSearch(debouncedSearch);
    onFiltersChange();
  }

  const syncedSearch = useRef(debouncedSearch);
  useEffect(() => {
    if (syncedSearch.current === debouncedSearch) return;
    syncedSearch.current = debouncedSearch;
    void navigate({
      search: (previous) => ({
        ...previous,
        q: debouncedSearch || undefined,
      }),
      replace: true,
    });
  }, [debouncedSearch, navigate]);

  return {
    statusFilter: urlSearch.status ?? null,
    isGrouped: urlSearch.group === "suite",
    search,
    setSearch,
    debouncedSearch,
    setStatusFilter: (status: TestResultStatus | null) => {
      updateUrlSearch({ status: status ?? undefined });
      onFiltersChange();
    },
    setGrouped: (isGrouped: boolean) =>
      updateUrlSearch({ group: isGrouped ? "suite" : undefined }),
  };
};
