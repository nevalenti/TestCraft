export interface AllureResultItem {
  name?: string;
  fullName?: string;
  status?: "passed" | "failed" | "broken" | "skipped" | "unknown";
  statusDetails?: { message?: string; trace?: string };
  labels?: Array<{ name: string; value: string }>;
}
