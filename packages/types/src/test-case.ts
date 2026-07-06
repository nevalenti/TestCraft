import type { components } from "./generated/schema.js";

export type TestCase =
  components["schemas"]["TestCraft.Application.TestCases.TestCaseResponse"];
export type CreateTestCase =
  components["schemas"]["TestCraft.Application.TestCases.CreateTestCase.Command"];
export type UpdateTestCase =
  components["schemas"]["TestCraft.Application.TestCases.UpdateTestCase.Command"];

export type TestCaseStep =
  components["schemas"]["TestCraft.Application.TestCaseSteps.TestCaseStepResponse"];
export type CreateTestCaseStep =
  components["schemas"]["TestCraft.Application.TestCaseSteps.CreateTestCaseStep.Command"];
export type UpdateTestCaseStep =
  components["schemas"]["TestCraft.Application.TestCaseSteps.UpdateTestCaseStep.Command"];
export type BulkReorderSteps =
  components["schemas"]["TestCraft.Application.TestCaseSteps.BulkReorderSteps.Command"];
