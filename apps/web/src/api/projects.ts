import { queryOptions } from "@tanstack/react-query";
import type {
  CreateProject,
  Paginated,
  Project,
  UpdateProject,
} from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { PAGE_SIZE } from "@/lib/constants";

const BASE = "projects";

export const projectsApi = {
  getAll: async (search?: string) => {
    const { data } = await client.get<Paginated<Project>>(BASE, {
      params: { pageSize: PAGE_SIZE, ...(search && { search }) },
    });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await client.get<Project>(`${BASE}/${id}`);
    return data;
  },
  create: async (input: CreateProject) => {
    const { data } = await client.post<Project>(BASE, input);
    return data;
  },
  update: async (id: string, input: UpdateProject) => {
    const { data } = await client.put<Project>(`${BASE}/${id}`, {
      ...input,
      id,
    });
    return data;
  },
  delete: (id: string) => client.delete(`${BASE}/${id}`),
};

export const projectQueries = {
  all: (search?: string) =>
    queryOptions({
      queryKey: [...queryKeys.projects.all, search],
      queryFn: () => projectsApi.getAll(search),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.projects.detail(id),
      queryFn: () => projectsApi.getById(id),
      enabled: !!id,
    }),
};
