import { queryOptions } from "@tanstack/react-query";
import type { AddProjectMember, ProjectMember } from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";

const BASE = (projectId: string) => `projects/${projectId}/members`;

export const projectMembersApi = {
  getAll: async (projectId: string) => {
    const { data } = await client.get<ProjectMember[]>(BASE(projectId));
    return data;
  },
  add: async (projectId: string, input: AddProjectMember) => {
    const { data } = await client.post<ProjectMember>(BASE(projectId), input);
    return data;
  },
  remove: (projectId: string, id: string) =>
    client.delete(`${BASE(projectId)}/${id}`),
};

export const projectMemberQueries = {
  all: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.projectMembers.all(projectId),
      queryFn: () => projectMembersApi.getAll(projectId),
      enabled: !!projectId,
    }),
};
