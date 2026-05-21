import { TestResultStatus } from "@/types";

export const statusBgClass: Record<TestResultStatus, string> = {
  [TestResultStatus.Passed]: "bg-success/[20%]",
  [TestResultStatus.Failed]: "bg-error/[20%]",
  [TestResultStatus.Blocked]: "bg-warning/[20%]",
  [TestResultStatus.Skipped]: "bg-base-100",
};
