import { TestResultStatus } from "@/types";

export const statusBorderClass: Record<TestResultStatus, string> = {
  [TestResultStatus.Passed]: "border-l-success",
  [TestResultStatus.Failed]: "border-l-error",
  [TestResultStatus.Blocked]: "border-l-warning",
  [TestResultStatus.Skipped]: "border-l-neutral",
};

export const statusBorderRightClass: Record<TestResultStatus, string> = {
  [TestResultStatus.Passed]: "border-r-success",
  [TestResultStatus.Failed]: "border-r-error",
  [TestResultStatus.Blocked]: "border-r-success",
  [TestResultStatus.Skipped]: "border-r-success",
};
