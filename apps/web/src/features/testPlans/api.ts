import { queryOptions } from "@tanstack/react-query";
import type { CreateTestPlan, UpdateTestPlan } from "@testcraft/types";

import { fetchAllPages } from "@/api/fetchAllPages";
import { ifMatch } from "@/api/ifMatch";
import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";
import { PAGE_SIZE } from "@/lib/constants";

export const testPlansApi = {
  getAll: async (projectId: string) => {
    const { items } = await fetchAllPages(async (page) => {
      const { data } = await sdk.listTestPlans({
        path: { project_id: projectId },
        query: { page, page_size: PAGE_SIZE },
      });
      return data;
    });
    return items;
  },
  getPage: async (
    projectId: string,
    page: number,
    search: string,
    sortBy: "name" | "created_at",
    sortDir: "asc" | "desc",
  ) => {
    const { data } = await sdk.listTestPlans({
      path: { project_id: projectId },
      query: {
        page,
        page_size: 20,
        search: search || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      },
    });
    return data;
  },
  getById: async (projectId: string, planId: string) => {
    const { data } = await sdk.getTestPlan({
      path: { project_id: projectId, plan_id: planId },
    });
    return data;
  },
  getCases: async (projectId: string, planId: string) => {
    const { data } = await sdk.getTestPlanCases({
      path: { project_id: projectId, plan_id: planId },
    });
    return data;
  },
  create: async (projectId: string, input: CreateTestPlan) => {
    const { data } = await sdk.createTestPlan({
      path: { project_id: projectId },
      body: input,
    });
    return data;
  },
  update: async (
    projectId: string,
    planId: string,
    input: UpdateTestPlan,
    version: number,
  ) => {
    const { data } = await sdk.updateTestPlan({
      path: { project_id: projectId, plan_id: planId },
      body: input,
      headers: ifMatch(version),
    });
    return data;
  },
  delete: (projectId: string, planId: string) =>
    sdk.deleteTestPlan({
      path: { project_id: projectId, plan_id: planId },
    }),
  addCase: (projectId: string, planId: string, caseId: string) =>
    sdk.addCaseToPlan({
      path: { project_id: projectId, plan_id: planId },
      body: { test_case_id: caseId },
    }),
  removeCase: (projectId: string, planId: string, caseId: string) =>
    sdk.removeCaseFromPlan({
      path: { project_id: projectId, plan_id: planId, case_id: caseId },
    }),
  reorderCases: (
    projectId: string,
    planId: string,
    cases: { test_case_id: string; order: number }[],
  ) =>
    sdk.reorderPlanCases({
      path: { project_id: projectId, plan_id: planId },
      body: { cases },
    }),
  createRun: async (
    projectId: string,
    planId: string,
    input: { name: string; environment: string },
  ) => {
    const { data } = await sdk.createRunFromPlan({
      path: { project_id: projectId, plan_id: planId },
      body: input,
    });
    return data;
  },
};

export const testPlanQueries = {
  all: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.testPlans.all(projectId),
      queryFn: () => testPlansApi.getAll(projectId),
      enabled: !!projectId,
    }),
  page: (
    projectId: string,
    page: number,
    search: string,
    sortBy: "name" | "created_at",
    sortDir: "asc" | "desc",
  ) =>
    queryOptions({
      queryKey: [
        ...queryKeys.testPlans.all(projectId),
        "page",
        page,
        search,
        sortBy,
        sortDir,
      ],
      queryFn: () =>
        testPlansApi.getPage(projectId, page, search, sortBy, sortDir),
      enabled: !!projectId,
    }),
  detail: (projectId: string, planId: string) =>
    queryOptions({
      queryKey: queryKeys.testPlans.detail(projectId, planId),
      queryFn: () => testPlansApi.getById(projectId, planId),
      enabled: !!projectId && !!planId,
    }),
  cases: (projectId: string, planId: string) =>
    queryOptions({
      queryKey: queryKeys.testPlans.cases(projectId, planId),
      queryFn: () => testPlansApi.getCases(projectId, planId),
      enabled: !!projectId && !!planId,
    }),
};
