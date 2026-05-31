import { TestRunStatus } from "@testcraft/types";

const RUN_STATUS_ORDER = new Map<TestRunStatus, number>([
  [TestRunStatus.Active, 0],
  [TestRunStatus.Completed, 1],
  [TestRunStatus.Archived, 2],
]);

export const canTransitionRunStatus = (
  from: TestRunStatus,
  to: TestRunStatus,
): boolean =>
  (RUN_STATUS_ORDER.get(to) ?? -1) >= (RUN_STATUS_ORDER.get(from) ?? -1);

export const canAddResultToRun = (runStatus: TestRunStatus): boolean =>
  runStatus !== TestRunStatus.Archived;
