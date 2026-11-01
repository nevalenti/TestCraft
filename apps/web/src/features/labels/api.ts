import { queryOptions } from "@tanstack/react-query";
import type { CreateLabel, UpdateLabel } from "@testcraft/types";

import { fetchAllPages } from "@/api/fetchAllPages";
import { ifMatch } from "@/api/ifMatch";
import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";
import { PAGE_SIZE } from "@/lib/constants";

export const labelsApi = {
  getAll: async (projectId: string) => {
    const { items } = await fetchAllPages(async (page) => {
      const { data } = await sdk.listLabels({
        path: { project_id: projectId },
        query: { page, page_size: PAGE_SIZE },
      });
      return data;
    });
    return items;
  },
  getPage: async (projectId: string, page: number, search: string) => {
    const { data } = await sdk.listLabels({
      path: { project_id: projectId },
      query: { page, page_size: 20, search: search || undefined },
    });
    return data;
  },
  create: async (projectId: string, input: CreateLabel) => {
    const { data } = await sdk.createLabel({
      path: { project_id: projectId },
      body: input,
    });
    return data;
  },
  update: async (
    projectId: string,
    id: string,
    input: UpdateLabel,
    version: number,
  ) => {
    const { data } = await sdk.updateLabel({
      path: { project_id: projectId, label_id: id },
      body: input,
      headers: ifMatch(version),
    });
    return data;
  },
  delete: (projectId: string, id: string) =>
    sdk.deleteLabel({ path: { project_id: projectId, label_id: id } }),
  addToCase: (projectId: string, caseId: string, labelId: string) =>
    sdk.addTestCaseLabel({
      path: { project_id: projectId, case_id: caseId, label_id: labelId },
    }),
  removeFromCase: (projectId: string, caseId: string, labelId: string) =>
    sdk.removeTestCaseLabel({
      path: { project_id: projectId, case_id: caseId, label_id: labelId },
    }),
};

export const labelQueries = {
  all: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.labels.all(projectId),
      queryFn: () => labelsApi.getAll(projectId),
      enabled: !!projectId,
    }),
  page: (projectId: string, page: number, search: string) =>
    queryOptions({
      queryKey: [...queryKeys.labels.all(projectId), "page", page, search],
      queryFn: () => labelsApi.getPage(projectId, page, search),
      enabled: !!projectId,
    }),
};
