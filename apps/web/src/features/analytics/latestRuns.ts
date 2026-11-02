import { type TestRun, TestRunStatus } from "@testcraft/types";

export const latestRuns = (runs: TestRun[]) => {
  const newestFirst = runs.toSorted((first, second) =>
    second.created_at.localeCompare(first.created_at),
  );
  const completed = newestFirst.filter(
    (run) => run.status === TestRunStatus.Completed,
  );

  return completed.length > 0 ? completed : newestFirst;
};
