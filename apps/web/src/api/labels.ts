import { queryOptions } from "@tanstack/react-query";
import type { CreateLabel, Label, UpdateLabel } from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";

const BASE = (projectId: string) => `projects/${projectId}/labels`;

export const labelsApi = {
  getAll: async (projectId: string) => {
    const { data } = await client.get<Label[]>(BASE(projectId));
    return data;
  },
  create: async (projectId: string, input: CreateLabel) => {
    const { data } = await client.post<Label>(BASE(projectId), input);
    return data;
  },
  update: async (projectId: string, id: string, input: UpdateLabel) => {
    const { data } = await client.put<Label>(`${BASE(projectId)}/${id}`, input);
    return data;
  },
  delete: (projectId: string, id: string) =>
    client.delete(`${BASE(projectId)}/${id}`),
  addToCase: (projectId: string, caseId: string, labelId: string) =>
    client.post(`projects/${projectId}/cases/${caseId}/labels/${labelId}`),
  removeFromCase: (projectId: string, caseId: string, labelId: string) =>
    client.delete(`projects/${projectId}/cases/${caseId}/labels/${labelId}`),
};

export const labelQueries = {
  all: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.labels.all(projectId),
      queryFn: () => labelsApi.getAll(projectId),
      enabled: !!projectId,
    }),
};
