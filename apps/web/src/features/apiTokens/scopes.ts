import type { ApiTokenScope } from "@testcraft/types";

export type ScopeAccess = "none" | "read" | "write";

export const TOKEN_RESOURCES = [
  { resource: "runs", label: "Test runs", canWrite: true },
  { resource: "results", label: "Test results", canWrite: true },
  { resource: "imports", label: "Imports", canWrite: true },
  { resource: "suites", label: "Test suites", canWrite: true },
  { resource: "cases", label: "Test cases", canWrite: true },
  { resource: "labels", label: "Labels", canWrite: true },
  { resource: "plans", label: "Test plans", canWrite: true },
  { resource: "notes", label: "Project notes", canWrite: true },
  { resource: "analytics", label: "Analytics", canWrite: false },
] as const;

export type TokenResource = (typeof TOKEN_RESOURCES)[number]["resource"];

export type TokenAccess = Record<TokenResource, ScopeAccess>;

export const CI_PIPELINE_ACCESS: TokenAccess = {
  runs: "write",
  results: "write",
  imports: "write",
  suites: "none",
  cases: "none",
  labels: "none",
  plans: "none",
  notes: "none",
  analytics: "none",
};

export const toScopes = (access: TokenAccess): ApiTokenScope[] =>
  TOKEN_RESOURCES.flatMap(({ resource }) =>
    access[resource] === "none"
      ? []
      : [`${resource}_${access[resource]}` as ApiTokenScope],
  );
