import { queryOptions } from "@tanstack/react-query";
import type {
  CreateProjectInput,
  Paginated,
  Project,
  UpdateProjectInput,
} from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { PAGE_SIZE } from "@/lib/constants";

const BASE = "projects";

export const projectsApi = {
  getAll: (search?: string) =>
    client
      .get<Paginated<Project>>(BASE, {
        params: { pageSize: PAGE_SIZE, ...(search ? { search } : {}) },
      })
      .then((response) => response.data),
  getById: (id: string) =>
    client.get<Project>(`${BASE}/${id}`).then((response) => response.data),
  create: (input: CreateProjectInput) =>
    client.post<Project>(BASE, input).then((response) => response.data),
  update: (id: string, input: UpdateProjectInput) =>
    client
      .put<Project>(`${BASE}/${id}`, input)
      .then((response) => response.data),
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
