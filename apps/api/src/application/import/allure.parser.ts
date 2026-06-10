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

  const map = new Map(labels.map((l) => [l.name, l.value]));

  for (const key of keys) {
    const val = map.get(key);

    if (val) return val;
  }

  return null;
};

export const parseAllure = (results: AllureResultItem[]): ParsedTestCase[] =>
  results.map((result, index) => ({
    suiteName:
      labelValue(result.labels, "suite", "parentSuite", "testClass") ??
      "Default Suite",
    caseName: result.name ?? result.fullName ?? `Unknown (${index + 1})`,
    status: resolveStatus(result.status),
    notes: result.statusDetails?.message ?? null,
  }));
