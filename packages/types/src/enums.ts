export const TestCasePriority = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
  Critical: "Critical",
} as const;

export const TestRunStatus = {
  Active: "Active",
  Completed: "Completed",
  Archived: "Archived",
} as const;

export const TestResultStatus = {
  Passed: "Passed",
  Failed: "Failed",
  Blocked: "Blocked",
  Skipped: "Skipped",
} as const;

export type TestCasePriority =
  (typeof TestCasePriority)[keyof typeof TestCasePriority];

export type TestRunStatus = (typeof TestRunStatus)[keyof typeof TestRunStatus];

export type TestResultStatus =
  (typeof TestResultStatus)[keyof typeof TestResultStatus];

export const DefectType = {
  ProductBug: "ProductBug",
  AutomationBug: "AutomationBug",
  EnvironmentIssue: "EnvironmentIssue",
  ToInvestigate: "ToInvestigate",
} as const;

export type DefectType = (typeof DefectType)[keyof typeof DefectType];
