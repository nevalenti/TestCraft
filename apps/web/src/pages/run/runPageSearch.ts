import { TestResultStatus } from "@testcraft/types";

export interface RunPageSearch {
  status?: TestResultStatus;
  q?: string;
  group?: "suite";
}

const RESULT_STATUSES = new Set<string>(Object.values(TestResultStatus));

export const validateRunPageSearch = (
  search: Record<string, unknown>,
): RunPageSearch => ({
  status: RESULT_STATUSES.has(search.status as string)
    ? (search.status as TestResultStatus)
    : undefined,
  q: typeof search.q === "string" && search.q ? search.q : undefined,
  group: search.group === "suite" ? "suite" : undefined,
});
