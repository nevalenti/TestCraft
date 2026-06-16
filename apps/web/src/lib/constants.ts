export const PAGE_SIZE = 500;
export const RESULTS_PAGE_SIZE = 10;

export const statusOptions = [
  { value: "Passed", label: "Passed" },
  { value: "Failed", label: "Failed" },
  { value: "Blocked", label: "Blocked" },
  { value: "Skipped", label: "Skipped" },
] as const;

export const priorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
] as const;

export const runStatusOptions = [
  { value: "Active", label: "Active" },
  { value: "Completed", label: "Completed" },
  { value: "Archived", label: "Archived" },
] as const;
