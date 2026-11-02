import { queryOptions } from "@tanstack/react-query";
import type { CreateProject, UpdateProject } from "@testcraft/types";

import { fetchAllPages } from "@/api/fetchAllPages";
import { ifMatch } from "@/api/ifMatch";
import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";
import { PAGE_SIZE } from "@/lib/constants";

export const projectsApi = {
  getAll: async (search?: string) => {
    return fetchAllPages(async (page) => {
      const { data } = await sdk.listProjects({
        query: { page, page_size: PAGE_SIZE, ...(search && { search }) },
      });
      return data;
    });
  },
  getById: async (id: string) => {
    const { data } = await sdk.getProject({
      path: { project_id: id },
    });
    return data;
  },
  create: async (input: CreateProject) => {
    const { data } = await sdk.createProject({ body: input });
    return data;
  },
  update: async (id: string, input: UpdateProject, version: number) => {
    const { data } = await sdk.updateProject({
      path: { project_id: id },
      body: input,
      headers: ifMatch(version),
    });
    return data;
  },
  delete: (id: string) => sdk.deleteProject({ path: { project_id: id } }),
  createDashboardSocketTicket: async () => {
    const { data } = await sdk.createDashboardSocketTicket();
    return data.ticket;
  },
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
