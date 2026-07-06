import type { components } from "./generated/schema.js";

export type TrendPoint =
  components["schemas"]["TestCraft.Application.Analytics.TrendPoint"];
export type SuiteBreakdown =
  components["schemas"]["TestCraft.Application.Analytics.SuiteBreakdown"];
export type FlakyTestStat =
  components["schemas"]["TestCraft.Application.Analytics.FlakyTestStat"];
export type RunComparison =
  components["schemas"]["TestCraft.Application.Analytics.RunComparison"];
export type ComparisonRow =
  components["schemas"]["TestCraft.Application.Analytics.ComparisonRow"];

export type ApiTokenResponse =
  components["schemas"]["TestCraft.Application.ApiTokens.ApiTokenResponse"];
export type CreateApiTokenResponse =
  components["schemas"]["TestCraft.Application.ApiTokens.CreateApiTokenResponse"];
export type CreateApiToken =
  components["schemas"]["TestCraft.Application.ApiTokens.CreateApiToken.Command"];
