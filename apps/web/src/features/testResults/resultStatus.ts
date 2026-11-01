export const STATUS_OPTIONS = [
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "blocked", label: "Blocked" },
  { value: "skipped", label: "Skipped" },
  { value: "untested", label: "Untested" },
] as const;

export const EXECUTED_STATUS_OPTIONS = STATUS_OPTIONS.filter(
  (option) => option.value !== "untested",
);

export const statusLabel = (status: string): string =>
  STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

export const STATUS_COLOR: Record<string, string> = {
  passed: "bg-success",
  failed: "bg-error",
  blocked: "bg-warning",
  skipped: "bg-base-content/40",
  untested: "bg-base-content/15",
};
