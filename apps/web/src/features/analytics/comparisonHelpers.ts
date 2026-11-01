import { TestResultStatus } from "@testcraft/types";

export const STATUS_BADGE: Record<TestResultStatus, string> = {
  [TestResultStatus.Passed]: "badge-success",
  [TestResultStatus.Failed]: "badge-error",
  [TestResultStatus.Blocked]: "badge-warning",
  [TestResultStatus.Skipped]: "badge-ghost",
  [TestResultStatus.Untested]: "badge-ghost badge-outline",
};

export const rowBg = (isRegression: boolean, isFix: boolean) => {
  if (isRegression) return "bg-error/5";
  if (isFix) return "bg-success/5";
  return "";
};
