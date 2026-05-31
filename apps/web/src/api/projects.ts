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
      .then((r) => r.data),
  getById: (id: string) =>
    client.get<Project>(`${BASE}/${id}`).then((r) => r.data),
  create: (dto: CreateProjectInput) =>
    client.post<Project>(BASE, dto).then((r) => r.data),
  update: (id: string, dto: UpdateProjectInput) =>
    client.put<Project>(`${BASE}/${id}`, dto).then((r) => r.data),
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
