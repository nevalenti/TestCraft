import { queryOptions } from "@tanstack/react-query";
import type {
  CreateTestCaseStep,
  ReorderTestCaseSteps,
  UpdateTestCaseStep,
} from "@testcraft/types";

import { fetchAllPages } from "@/api/fetchAllPages";
import { ifMatch } from "@/api/ifMatch";
import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";
import { PAGE_SIZE } from "@/lib/constants";

export const testCaseStepsApi = {
  getAll: async (projectId: string, suiteId: string, caseId: string) => {
    return fetchAllPages(async (page) => {
      const { data } = await sdk.listTestCaseSteps({
        path: { project_id: projectId, suite_id: suiteId, case_id: caseId },
        query: { page, page_size: PAGE_SIZE },
      });
      return data;
    });
  },
  create: async (
    projectId: string,
    suiteId: string,
    caseId: string,
    input: CreateTestCaseStep,
  ) => {
    const { data } = await sdk.createTestCaseStep({
      path: { project_id: projectId, suite_id: suiteId, case_id: caseId },
      body: input,
    });
    return data;
  },
  update: async (
    projectId: string,
    suiteId: string,
    caseId: string,
    id: string,
    input: UpdateTestCaseStep,
    version: number,
  ) => {
    const { data } = await sdk.updateTestCaseStep({
      path: {
        project_id: projectId,
        suite_id: suiteId,
        case_id: caseId,
        step_id: id,
      },
      body: input,
      headers: ifMatch(version),
    });
    return data;
  },
  reorder: (
    projectId: string,
    suiteId: string,
    caseId: string,
    input: ReorderTestCaseSteps,
  ) =>
    sdk.reorderTestCaseSteps({
      path: { project_id: projectId, suite_id: suiteId, case_id: caseId },
      body: input,
    }),
  delete: (projectId: string, suiteId: string, caseId: string, id: string) =>
    sdk.deleteTestCaseStep({
      path: {
        project_id: projectId,
        suite_id: suiteId,
        case_id: caseId,
        step_id: id,
      },
    }),
};

export const testCaseStepQueries = {
  all: (projectId: string, suiteId: string, caseId: string) =>
    queryOptions({
      queryKey: queryKeys.testCaseSteps.all(projectId, suiteId, caseId),
      queryFn: () => testCaseStepsApi.getAll(projectId, suiteId, caseId),
      enabled: !!projectId && !!suiteId && !!caseId,
    }),
};
