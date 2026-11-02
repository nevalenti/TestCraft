import { queryOptions } from "@tanstack/react-query";
import type {
  CreatePersonalNote,
  CreateProjectNote,
  UpdatePersonalNote,
  UpdateProjectNote,
} from "@testcraft/types";

import { fetchAllPages } from "@/api/fetchAllPages";
import { ifMatch } from "@/api/ifMatch";
import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";
import { PAGE_SIZE } from "@/lib/constants";

export const personalNotesApi = {
  getAll: async (search?: string) => {
    return fetchAllPages(async (page) => {
      const { data } = await sdk.listPersonalNotes({
        query: { page, page_size: PAGE_SIZE, ...(search && { search }) },
      });
      return data;
    });
  },
  getById: async (id: string) => {
    const { data } = await sdk.getPersonalNote({
      path: { note_id: id },
    });
    return data;
  },
  create: async (input: CreatePersonalNote) => {
    const { data } = await sdk.createPersonalNote({ body: input });
    return data;
  },
  update: async (id: string, input: UpdatePersonalNote, version: number) => {
    const { data } = await sdk.updatePersonalNote({
      path: { note_id: id },
      body: input,
      headers: ifMatch(version),
    });
    return data;
  },
  delete: (id: string) => sdk.deletePersonalNote({ path: { note_id: id } }),
};

export const personalNoteQueries = {
  all: (search?: string) =>
    queryOptions({
      queryKey: [...queryKeys.notes.personal.lists(), search],
      queryFn: () => personalNotesApi.getAll(search),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.notes.personal.detail(id),
      queryFn: () => personalNotesApi.getById(id),
      enabled: !!id,
    }),
};

export const projectNotesApi = {
  getAll: async (projectId: string, search?: string) => {
    return fetchAllPages(async (page) => {
      const { data } = await sdk.listProjectNotes({
        path: { project_id: projectId },
        query: { page, page_size: PAGE_SIZE, ...(search && { search }) },
      });
      return data;
    });
  },
  getById: async (projectId: string, id: string) => {
    const { data } = await sdk.getProjectNote({
      path: { project_id: projectId, note_id: id },
    });
    return data;
  },
  create: async (projectId: string, input: CreateProjectNote) => {
    const { data } = await sdk.createProjectNote({
      path: { project_id: projectId },
      body: input,
    });
    return data;
  },
  update: async (
    projectId: string,
    id: string,
    input: UpdateProjectNote,
    version: number,
  ) => {
    const { data } = await sdk.updateProjectNote({
      path: { project_id: projectId, note_id: id },
      body: input,
      headers: ifMatch(version),
    });
    return data;
  },
  delete: (projectId: string, id: string) =>
    sdk.deleteProjectNote({
      path: { project_id: projectId, note_id: id },
    }),
};

export const projectNoteQueries = {
  all: (projectId: string, search?: string) =>
    queryOptions({
      queryKey: [...queryKeys.notes.project.lists(projectId), search],
      queryFn: () => projectNotesApi.getAll(projectId, search),
      enabled: !!projectId,
    }),
  detail: (projectId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.notes.project.detail(projectId, id),
      queryFn: () => projectNotesApi.getById(projectId, id),
      enabled: !!projectId && !!id,
    }),
};
