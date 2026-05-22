import { queryOptions } from "@tanstack/react-query";

import type { CreateProjectDto, ProjectDto, UpdateProjectDto } from "@/types";

import client from "./client";
import { queryKeys } from "./queryKeys";

const BASE = "/api/v1/projects";

export const projectsApi = {
  getAll: (search?: string) =>
    client
      .get<ProjectDto[]>(BASE, { params: search ? { search } : undefined })
      .then((r) => r.data),
  getById: (id: string) =>
    client.get<ProjectDto>(`${BASE}/${id}`).then((r) => r.data),
  create: (dto: CreateProjectDto) =>
    client.post<ProjectDto>(BASE, dto).then((r) => r.data),
  update: (id: string, dto: UpdateProjectDto) =>
    client.put<ProjectDto>(`${BASE}/${id}`, dto).then((r) => r.data),
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
