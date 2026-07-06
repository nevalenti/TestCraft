import type { components } from "./generated/schema.js";

export type TestPlan =
  components["schemas"]["TestCraft.Application.TestPlans.TestPlanResponse"];
export type TestPlanCase =
  components["schemas"]["TestCraft.Application.TestPlans.TestPlanCaseResponse"];
export type CreateTestPlan =
  components["schemas"]["TestCraft.Application.TestPlans.CreateTestPlan.Command"];
export type UpdateTestPlan =
  components["schemas"]["TestCraft.Application.TestPlans.UpdateTestPlan.Command"];
