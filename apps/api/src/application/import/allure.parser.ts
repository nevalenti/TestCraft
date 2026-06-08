import type { AllureResultItem } from "@testcraft/types";
import { TestResultStatus } from "@testcraft/types";

import type { ParsedTestCase } from "./import.repository";

const resolveStatus = (
  status: AllureResultItem["status"],
): TestResultStatus => {
  switch (status) {
    case "passed": {
      return TestResultStatus.Passed;
    }
    case "failed":
    case "broken": {
      return TestResultStatus.Failed;
    }
    case "skipped": {
      return TestResultStatus.Skipped;
    }
    default: {
      return TestResultStatus.Blocked;
    }
  }
};

const labelValue = (
  labels: AllureResultItem["labels"],
  ...keys: string[]
): string | null => {
  if (!labels) return null;
  for (const key of keys) {
    const found = labels.find((label) => label.name === key);
    if (found?.value) return found.value;
  }
  return null;
};

export const parseAllure = (results: AllureResultItem[]): ParsedTestCase[] =>
  results.map((result, index) => {
    const suiteName =
      labelValue(result.labels, "suite", "parentSuite", "testClass") ??
      "Default Suite";
    const caseName = result.name ?? result.fullName ?? `Unknown (${index + 1})`;
    const status = resolveStatus(result.status);
    const notes = result.statusDetails?.message ?? null;
    return { suiteName, caseName, status, notes };
  });
