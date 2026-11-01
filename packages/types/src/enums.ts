export const TestCasePriority = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical",
} as const;

export const TestRunStatus = {
  Active: "active",
  Completed: "completed",
  Archived: "archived",
} as const;

export const TestResultStatus = {
  Passed: "passed",
  Failed: "failed",
  Blocked: "blocked",
  Skipped: "skipped",
  Untested: "untested",
} as const;

export type TestCasePriority =
  (typeof TestCasePriority)[keyof typeof TestCasePriority];

export type TestRunStatus = (typeof TestRunStatus)[keyof typeof TestRunStatus];

export type TestResultStatus =
  (typeof TestResultStatus)[keyof typeof TestResultStatus];

export const DefectType = {
  ProductBug: "product_bug",
  AutomationBug: "automation_bug",
  EnvironmentIssue: "environment_issue",
  ToInvestigate: "to_investigate",
} as const;

export type DefectType = (typeof DefectType)[keyof typeof DefectType];

export const NotificationEvent = {
  RunCompleted: "run.completed",
} as const;

export type NotificationEvent =
  (typeof NotificationEvent)[keyof typeof NotificationEvent];

export const ProjectRole = {
  Viewer: "viewer",
  Editor: "editor",
  Admin: "admin",
  Owner: "owner",
} as const;

export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

export const AssignableRole = {
  Viewer: "viewer",
  Editor: "editor",
  Admin: "admin",
} as const;

export type AssignableRole =
  (typeof AssignableRole)[keyof typeof AssignableRole];
