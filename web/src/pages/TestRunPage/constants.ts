import { TestResultStatus } from "@/types";

export const statusBorderClass: Record<TestResultStatus, string> = {
  [TestResultStatus.Passed]: "border-l-success",
  [TestResultStatus.Failed]: "border-l-error",
  [TestResultStatus.Blocked]: "border-l-warning",
  [TestResultStatus.Skipped]: "border-l-neutral",
};
