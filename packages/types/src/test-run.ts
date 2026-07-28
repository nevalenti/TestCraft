import type { components } from './generated/schema.js';

export type TestRun =
  components['schemas']['TestCraft.Application.TestRuns.TestRunResponse'];
export type CreateTestRun =
  components['schemas']['TestCraft.Application.TestRuns.CreateTestRun.Command'];
export type UpdateTestRun =
  components['schemas']['TestCraft.Application.TestRuns.UpdateTestRun.Command'];
export type TestRunSummary =
  components['schemas']['TestCraft.Application.TestRuns.GetTestRunSummary.Response'];
