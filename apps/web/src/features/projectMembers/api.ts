import { queryOptions } from "@tanstack/react-query";
import type { AddProjectMember, UpdateProjectMember } from "@testcraft/types";

import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";

export const projectMembersApi = {
  getAll: async (projectId: string) => {
    const { data } = await sdk.listProjectMembers({
      path: { project_id: projectId },
    });
    return data;
  },
  add: async (projectId: string, input: AddProjectMember) => {
    const { data } = await sdk.addProjectMember({
      path: { project_id: projectId },
      body: input,
    });
    return data;
  },
  update: async (projectId: string, id: string, input: UpdateProjectMember) => {
    const { data } = await sdk.updateProjectMember({
      path: { project_id: projectId, member_id: id },
      body: input,
    });
    return data;
  },
  remove: (projectId: string, id: string) =>
    sdk.removeProjectMember({
      path: { project_id: projectId, member_id: id },
    }),
};

export const projectMemberQueries = {
  all: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.projectMembers.all(projectId),
      queryFn: () => projectMembersApi.getAll(projectId),
      enabled: !!projectId,
    }),
};
