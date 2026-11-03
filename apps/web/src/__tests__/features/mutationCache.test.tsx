import { TestRunStatus } from "@testcraft/types";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiResponse, makeTestCase, paginated } from "@/__tests__/fixtures";
import { createWrapper } from "@/__tests__/test-utils";
import { queryKeys } from "@/api/queryKeys";
import { labelsApi } from "@/features/labels/api";
import {
  useAddTestCaseLabel,
  useDeleteLabel,
  useRemoveTestCaseLabel,
  useUpdateLabel,
} from "@/features/labels/hooks";
import { testCaseQueries } from "@/features/testCases/api";
import { testCaseStepsApi } from "@/features/testCaseSteps/api";
import {
  useCreateTestCaseStep,
  useDeleteTestCaseStep,
} from "@/features/testCaseSteps/hooks";
import { testPlansApi } from "@/features/testPlans/api";
import {
  useAddCaseToPlan,
  useCreateRunFromPlan,
  useRemoveCaseFromPlan,
} from "@/features/testPlans/hooks";
import { testResultsApi } from "@/features/testResults/api";
import { useUpdateTestResult } from "@/features/testResults/hooks";
import { testRunsApi } from "@/features/testRuns/api";
import { useCreateTestRun, useDeleteTestRun } from "@/features/testRuns/hooks";
import { testSuitesApi } from "@/features/testSuites/api";
import {
  useCreateTestSuite,
  useDeleteTestSuite,
  useUpdateTestSuite,
} from "@/features/testSuites/hooks";

vi.mock("@/api/client", () => ({ apiClient: {} }));
vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));
afterEach(() => vi.restoreAllMocks());

const label = {
  id: "label-1",
  version: 1,
  name: "Smoke",
  color: "#ffffff",
  project_id: "p1",
};
const suite = {
  id: "s1",
  version: 1,
  project_id: "p1",
  name: "Suite",
  created_at: "",
  updated_at: "",
};
const keys = {
  catalog: testCaseQueries.byProject("p1").queryKey,
  cases: testCaseQueries.all("p1", "s1", "search").queryKey,
  detail: testCaseQueries.detail("p1", "s1", "c1").queryKey,
  plan: queryKeys.testPlans.cases("p1", "plan-1"),
  planList: queryKeys.testPlans.all("p1"),
  steps: queryKeys.testCaseSteps.all("p1", "s1", "c1"),
  runs: queryKeys.testRuns.all("p1"),
  project: queryKeys.projects.detail("p1"),
  results: queryKeys.testResults.all("p1", "r1"),
  summary: queryKeys.testRuns.summary("p1", "r1"),
  analytics: queryKeys.analytics.trend("p1", 20),
  labels: queryKeys.labels.all("p1"),
  otherProject: queryKeys.testCases.byProject("p2"),
};
const run = {
  id: "r1",
  version: 1,
  name: "Run",
  environment: "test",
  project_id: "p1",
  status: TestRunStatus.Active,
  created_at: "",
  updated_at: "",
};
const scenarios = [
  {
    name: "adding a case to a plan",
    affected: ["plan", "planList"],
    mock: () =>
      vi
        .spyOn(testPlansApi, "addCase")
        .mockResolvedValue(apiResponse(undefined)),
    useMutation: () => {
      const mutation = useAddCaseToPlan("p1", "plan-1");
      return () => mutation.mutateAsync("c1");
    },
  },
  {
    name: "removing a case from a plan",
    affected: ["plan", "planList"],
    mock: () =>
      vi
        .spyOn(testPlansApi, "removeCase")
        .mockResolvedValue(apiResponse(undefined)),
    useMutation: () => {
      const mutation = useRemoveCaseFromPlan("p1", "plan-1");
      return () => mutation.mutateAsync("c1");
    },
  },
  {
    name: "adding a label",
    affected: ["cases", "detail", "catalog"],
    mock: () =>
      vi
        .spyOn(labelsApi, "addToCase")
        .mockResolvedValue(apiResponse(undefined)),
    useMutation: () => {
      const mutation = useAddTestCaseLabel("p1", "s1", "c1");
      return () => mutation.mutateAsync(label.id);
    },
  },
  {
    name: "removing a label",
    affected: ["cases", "detail", "catalog"],
    mock: () =>
      vi
        .spyOn(labelsApi, "removeFromCase")
        .mockResolvedValue(apiResponse(undefined)),
    useMutation: () => {
      const mutation = useRemoveTestCaseLabel("p1", "s1", "c1");
      return () => mutation.mutateAsync(label.id);
    },
  },
  {
    name: "renaming a label",
    affected: ["labels", "cases", "detail", "catalog"],
    mock: () => vi.spyOn(labelsApi, "update").mockResolvedValue(label),
    useMutation: () => {
      const mutation = useUpdateLabel("p1");
      return () =>
        mutation.mutateAsync({
          id: label.id,
          version: label.version,
          name: "Renamed",
          color: label.color,
        });
    },
  },
  {
    name: "deleting a label",
    affected: ["labels", "cases", "detail", "catalog"],
    mock: () =>
      vi.spyOn(labelsApi, "delete").mockResolvedValue(apiResponse(undefined)),
    useMutation: () => {
      const mutation = useDeleteLabel("p1");
      return () => mutation.mutateAsync(label.id);
    },
  },
  {
    name: "renaming a suite",
    affected: ["cases", "detail", "plan", "analytics"],
    mock: () => vi.spyOn(testSuitesApi, "update").mockResolvedValue(suite),
    useMutation: () => {
      const mutation = useUpdateTestSuite("p1");
      return () =>
        mutation.mutateAsync({ id: "s1", version: 1, name: "Renamed" });
    },
  },
  {
    name: "deleting a suite",
    affected: ["catalog", "plan", "project", "runs", "analytics"],
    removed: ["cases", "detail", "steps"],
    untouched: ["labels"],
    mock: () =>
      vi
        .spyOn(testSuitesApi, "delete")
        .mockResolvedValue(apiResponse(undefined)),
    useMutation: () => {
      const mutation = useDeleteTestSuite("p1");
      return () => mutation.mutateAsync("s1");
    },
  },
  {
    name: "creating a step",
    affected: ["cases", "detail", "catalog", "steps"],
    mock: () =>
      vi.spyOn(testCaseStepsApi, "create").mockResolvedValue({
        id: "step-1",
        version: 1,
        test_case_id: "c1",
        action: "Login",
        expected_result: "Success",
        order: 1,
        created_at: "",
        updated_at: "",
      }),
    useMutation: () => {
      const mutation = useCreateTestCaseStep("p1", "s1", "c1");
      return () =>
        mutation.mutateAsync({
          action: "Login",
          expected_result: "Success",
          order: 1,
        });
    },
  },
  {
    name: "deleting a step",
    affected: ["cases", "detail", "catalog", "steps"],
    mock: () =>
      vi
        .spyOn(testCaseStepsApi, "delete")
        .mockResolvedValue(apiResponse(undefined)),
    useMutation: () => {
      const mutation = useDeleteTestCaseStep("p1", "s1", "c1");
      return () => mutation.mutateAsync("step-1");
    },
  },
  {
    name: "creating a run from a plan",
    affected: ["runs", "project"],
    untouched: ["labels"],
    mock: () => vi.spyOn(testPlansApi, "createRun").mockResolvedValue(run),
    useMutation: () => {
      const mutation = useCreateRunFromPlan("p1");
      return () =>
        mutation.mutateAsync({
          planId: "plan-1",
          name: "Run",
          environment: "test",
        });
    },
  },
  {
    name: "creating a run",
    affected: ["runs", "project"],
    untouched: ["labels"],
    mock: () => vi.spyOn(testRunsApi, "create").mockResolvedValue(run),
    useMutation: () => {
      const mutation = useCreateTestRun("p1");
      return () => mutation.mutateAsync({ name: "Run", environment: "test" });
    },
  },
  {
    name: "deleting a run",
    affected: ["runs", "analytics", "project"],
    untouched: ["labels"],
    mock: () =>
      vi.spyOn(testRunsApi, "delete").mockResolvedValue(apiResponse(undefined)),
    useMutation: () => {
      const mutation = useDeleteTestRun("p1");
      return () => mutation.mutateAsync("r1");
    },
  },
  {
    name: "creating a suite",
    affected: ["project"],
    untouched: ["labels"],
    mock: () => vi.spyOn(testSuitesApi, "create").mockResolvedValue(suite),
    useMutation: () => {
      const mutation = useCreateTestSuite("p1");
      return () => mutation.mutateAsync({ name: "Suite" });
    },
  },
  {
    name: "updating a result",
    affected: ["results", "summary", "analytics"],
    mock: () =>
      vi.spyOn(testResultsApi, "update").mockResolvedValue({
        id: "result-1",
        version: 1,
        suite_id: "s1",
        test_case_id: "c1",
        test_case_name: "Login",
        test_run_id: "r1",
        status: "passed",
        executed_at: null,
        created_at: "",
        updated_at: "",
      }),
    useMutation: () => {
      const mutation = useUpdateTestResult("p1", "r1");
      return () =>
        mutation.mutateAsync({ id: "result-1", version: 1, status: "passed" });
    },
  },
];

describe("mutation cache projections", () => {
  it.each(scenarios)(
    "$name refreshes dependent projections without touching another project",
    async (scenario) => {
      const { queryClient, wrapper } = createWrapper();
      for (const key of Object.values(keys)) queryClient.setQueryData(key, []);
      queryClient.setQueryData(
        keys.cases,
        paginated([makeTestCase({ id: "c1", suite_id: "s1" })]),
      );
      queryClient.setQueryData(
        keys.detail,
        makeTestCase({ id: "c1", suite_id: "s1" }),
      );
      queryClient.setQueryData(keys.steps, paginated([]));
      scenario.mock();
      const { result } = renderHook(() => scenario.useMutation(), { wrapper });
      await act(async () => {
        await result.current();
      });
      for (const name of scenario.affected) {
        expect(
          queryClient.getQueryState(keys[name as keyof typeof keys])
            ?.isInvalidated,
          name,
        ).toBe(true);
      }
      if ("removed" in scenario) {
        const removed = scenario.removed ?? [];
        for (const name of removed)
          expect(
            queryClient.getQueryData(keys[name as keyof typeof keys]),
            name,
          ).toBeUndefined();
      }
      if ("untouched" in scenario) {
        for (const name of scenario.untouched ?? [])
          expect(
            queryClient.getQueryState(keys[name as keyof typeof keys])
              ?.isInvalidated,
            name,
          ).toBe(false);
      }
      expect(queryClient.getQueryState(keys.otherProject)?.isInvalidated).toBe(
        false,
      );
    },
  );
});
