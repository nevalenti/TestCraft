import type { AllureResultItem } from "@testcraft/types";
import { TestResultStatus, TestRunStatus } from "@testcraft/types";
import { XMLParser } from "fast-xml-parser";

import type {
  IImportRepository,
  ParsedCase,
} from "@/application/import/import.repository";
import { DomainError } from "@/domain/errors";
import type { TestRun } from "@/domain/test-run";

const junitParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
  isArray: (name) => ["testsuite", "testcase"].includes(name),
});

export interface ImportJUnitInput {
  xml: string;
  environment: string;
  name?: string;
}

export interface ImportAllureInput {
  results: AllureResultItem[];
  environment: string;
  name?: string;
}

const extractXmlText = (node: unknown): string | null => {
  if (typeof node === "string") return node || null;
  if (typeof node === "object" && node !== null) {
    const obj = node as Record<string, unknown>;
    const text = obj["#text"] ?? obj.message ?? null;
    return typeof text === "string" ? text.trim() || null : null;
  }
  return null;
};

const resolveJUnitStatus = (
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

const parseJUnit = (xml: string): { runName: string; cases: ParsedCase[] } => {
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

  const cases: ParsedCase[] = [];
  for (const suite of suites) {
    const suiteNameFromAttr = strVal(suite.name);
    const testcases = (suite.testcase as Record<string, unknown>[]) ?? [];
    for (const testcase of testcases) {
      const caseName = strVal(testcase.name) ?? "Unknown";
      const suiteName =
        suiteNameFromAttr ?? strVal(testcase.classname) ?? "Default Suite";
      cases.push({ suiteName, caseName, ...resolveJUnitStatus(testcase) });
    }
  }

  return { runName, cases };
};

const resolveAllureStatus = (
  status: AllureResultItem["status"],
): TestResultStatus => {
  switch (status) {
    case "passed":
      return TestResultStatus.Passed;
    case "failed":
    case "broken":
      return TestResultStatus.Failed;
    case "skipped":
      return TestResultStatus.Skipped;
    default:
      return TestResultStatus.Blocked;
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

const parseAllure = (results: AllureResultItem[]): ParsedCase[] =>
  results.map((result, index) => {
    const suiteName =
      labelValue(result.labels, "suite", "parentSuite", "testClass") ??
      "Default Suite";
    const caseName = result.name ?? result.fullName ?? `Unknown (${index + 1})`;
    const status = resolveAllureStatus(result.status);
    const notes =
      [result.statusDetails?.message, result.statusDetails?.trace]
        .filter(Boolean)
        .join("\n") || null;
    return { suiteName, caseName, status, notes };
  });

export interface IImportService {
  importJunit(
    projectId: string,
    input: ImportJUnitInput,
    userId?: string,
  ): Promise<TestRun>;
  importAllure(
    projectId: string,
    input: ImportAllureInput,
    userId?: string,
  ): Promise<TestRun>;
}

export class ImportService implements IImportService {
  constructor(private readonly importRepository: IImportRepository) {}

  async importJunit(
    projectId: string,
    input: ImportJUnitInput,
    userId?: string,
  ): Promise<TestRun> {
    const { runName, cases } = parseJUnit(input.xml);
    return this.importRepository.createRunWithResults(
      projectId,
      input.name ?? runName,
      input.environment,
      TestRunStatus.Completed,
      cases,
      userId,
    );
  }

  async importAllure(
    projectId: string,
    input: ImportAllureInput,
    userId?: string,
  ): Promise<TestRun> {
    const cases = parseAllure(input.results);
    return this.importRepository.createRunWithResults(
      projectId,
      input.name ?? "Allure Import",
      input.environment,
      TestRunStatus.Completed,
      cases,
      userId,
    );
  }
}
