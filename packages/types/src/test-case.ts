import type { components } from "./generated/schema.js";

export type TestCase = components["schemas"]["TestCaseResponse"];
export type CreateTestCase = components["schemas"]["CreateTestCaseRequest"];
export type UpdateTestCase = components["schemas"]["UpdateTestCaseRequest"];

export type TestCaseStep = components["schemas"]["TestCaseStepResponse"];
export type CreateTestCaseStep =
  components["schemas"]["CreateTestCaseStepRequest"];
export type UpdateTestCaseStep =
  components["schemas"]["UpdateTestCaseStepRequest"];
export type ReorderTestCaseSteps =
  components["schemas"]["ReorderTestCaseStepsRequest"];
