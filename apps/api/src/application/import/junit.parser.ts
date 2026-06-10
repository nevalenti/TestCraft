import { TestResultStatus } from "@testcraft/types";
import { XMLParser } from "fast-xml-parser";

import { DomainError } from "@/domain/errors";

import type { ParsedStep, ParsedTestCase } from "./import.repository";

const ARRAY_NODES = new Set(["testsuite", "testcase"]);

const junitParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
  isArray: (name) => ARRAY_NODES.has(name),
});

const extractXmlText = (node: unknown): string | null => {
  if (typeof node === "string") return node || null;
  if (typeof node === "object" && node !== null) {
    const obj = node as Record<string, unknown>;
    const text = obj.message ?? null;

    return typeof text === "string" ? text.trim() || null : null;
  }

  return null;
};

const resolveStatus = (
  testcase: Record<string, unknown>,
): { status: TestResultStatus; notes: string | null } => {
  if ("failure" in testcase || "error" in testcase)
    return {
      status: TestResultStatus.Failed,
      notes: extractXmlText(testcase.failure ?? testcase.error),
    };
  if ("skipped" in testcase)
    return { status: TestResultStatus.Skipped, notes: null };

  return { status: TestResultStatus.Passed, notes: null };
};

const strVal = (value: unknown): string | null =>
  typeof value === "string" && value ? value : null;

const resolveSuiteName = (
  suiteNameFromAttr: string | null,
  testcase: Record<string, unknown>,
): string => {
  const classname = strVal(testcase.classname);

  if (suiteNameFromAttr?.toLowerCase().endsWith(".dll")) {
    return classname ?? suiteNameFromAttr;
  }

  return suiteNameFromAttr ?? classname ?? "Default Suite";
};

const SEP = " > ";

const parseSteps = (caseName: string): ParsedStep[] => {
  const idx = caseName.lastIndexOf(SEP);

  if (idx === -1) return [];

  return [
    {
      order: 1,
      action: caseName.slice(0, idx),
      expectedResult: caseName.slice(idx + SEP.length),
    },
  ];
};

const DEFAULT_RUN_NAME = "Imported Run";

export const parseJUnit = (
  xml: string,
): { runName: string; cases: ParsedTestCase[] } => {
  let doc: Record<string, unknown>;

  try {
    doc = junitParser.parse(xml) as Record<string, unknown>;
  } catch {
    throw new DomainError("Invalid JUnit XML: could not parse the document");
  }

  let suites: Record<string, unknown>[] = [];
  let runName = DEFAULT_RUN_NAME;

  if (doc.testsuites) {
    const testsuites = doc.testsuites as Record<string, unknown>;

    runName = strVal(testsuites.name) ?? DEFAULT_RUN_NAME;
    suites = (testsuites.testsuite as Record<string, unknown>[]) ?? [];
  } else if (doc.testsuite) {
    suites = doc.testsuite as Record<string, unknown>[];
    const first = suites[0];

    if (first) runName = strVal(first.name) ?? DEFAULT_RUN_NAME;
  }

  const cases = suites.flatMap((suite) => {
    const suiteNameFromAttr = strVal(suite.name);

    return ((suite.testcase as Record<string, unknown>[]) ?? []).map(
      (testcase) => {
        const caseName = strVal(testcase.name) ?? "Unknown";

        return {
          suiteName: resolveSuiteName(suiteNameFromAttr, testcase),
          caseName,
          ...resolveStatus(testcase),
          steps: parseSteps(caseName),
        };
      },
    );
  });

  return { runName, cases };
};
