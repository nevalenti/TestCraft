import { TestResultStatus } from "@testcraft/types";
import { XMLParser } from "fast-xml-parser";

import { DomainError } from "@/domain/errors";

import type { ParsedStep, ParsedTestCase } from "./import.repository";

const junitParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
  isArray: (name) => ["testsuite", "testcase"].includes(name),
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
  if ("failure" in testcase)
    return {
      status: TestResultStatus.Failed,
      notes: extractXmlText(testcase.failure),
    };
  if ("error" in testcase)
    return {
      status: TestResultStatus.Failed,
      notes: extractXmlText(testcase.error),
    };
  if ("skipped" in testcase)
    return { status: TestResultStatus.Skipped, notes: null };
  return { status: TestResultStatus.Passed, notes: null };
};

const strVal = (value: unknown): string | null =>
  typeof value === "string" && value ? value : null;

const parseSteps = (caseName: string): ParsedStep[] => {
  const parts = caseName.split(" > ");
  if (parts.length < 2) return [];
  return [
    {
      order: 1,
      action: parts.slice(0, -1).join(" > "),
      expectedResult: parts.at(-1)!,
    },
  ];
};

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
  let runName = "Imported Run";

  if (doc.testsuites) {
    const testsuites = doc.testsuites as Record<string, unknown>;
    runName = strVal(testsuites.name) ?? "Imported Run";
    suites = (testsuites.testsuite as Record<string, unknown>[]) ?? [];
  } else if (doc.testsuite) {
    suites = doc.testsuite as Record<string, unknown>[];
    const first = suites[0];
    if (first) runName = strVal(first.name) ?? "Imported Run";
  }

  const cases: ParsedTestCase[] = [];
  for (const suite of suites) {
    const suiteNameFromAttr = strVal(suite.name);
    const testcases = (suite.testcase as Record<string, unknown>[]) ?? [];
    for (const testcase of testcases) {
      const caseName = strVal(testcase.name) ?? "Unknown";
      const suiteName =
        suiteNameFromAttr ?? strVal(testcase.classname) ?? "Default Suite";
      cases.push({
        suiteName,
        caseName,
        ...resolveStatus(testcase),
        steps: parseSteps(caseName),
      });
    }
  }

  return { runName, cases };
};
