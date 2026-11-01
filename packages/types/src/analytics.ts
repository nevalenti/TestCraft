import type { components } from "./generated/schema.js";

export type TrendPoint = components["schemas"]["TrendPointResponse"];
export type SuiteBreakdown = components["schemas"]["SuiteBreakdownResponse"];
export type FlakyTestStat = components["schemas"]["FlakyTestStatResponse"];
export type RunComparison = components["schemas"]["RunComparisonResponse"];
export type ComparisonRow = components["schemas"]["ComparisonRowResponse"];

export type ApiTokenResponse = components["schemas"]["ApiTokenResponse"];
export type ApiTokenScope = components["schemas"]["ApiTokenScope"];
export type CreateApiTokenResponse =
  components["schemas"]["CreateApiTokenResponse"];
export type CreateApiToken = components["schemas"]["CreateApiTokenRequest"];
