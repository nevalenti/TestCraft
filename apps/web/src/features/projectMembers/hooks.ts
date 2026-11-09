import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AddProjectMember,
  AssignableRole,
  ProjectMember,
} from "@testcraft/types";

import { findCached } from "@/api/findCached";
import { queryKeys } from "@/api/queryKeys";
import {
  projectMemberQueries,
  projectMembersApi,
} from "@/features/projectMembers/api";
import { notify } from "@/lib/notify";

export const useProjectMembers = (projectId: string) =>
  useQuery(projectMemberQueries.all(projectId));

export const useAddProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddProjectMember) =>
      projectMembersApi.add(projectId, input),
    onSuccess: (_, input) => {
      notify(`${input.email} added to project`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMembers.all(projectId),
      });
    },
  });
};

export const useUpdateProjectMemberRole = (projectId: string) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.projectMembers.all(projectId);

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: AssignableRole }) =>
      projectMembersApi.update(projectId, id, { role }),
    onMutate: async ({ id, role }) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<ProjectMember[]>(queryKey);
      queryClient.setQueryData<ProjectMember[]>(queryKey, (current) =>
        current?.map((member) =>
          member.id === id ? { ...member, role } : member,
        ),
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: (member) => {
      notify(
        `${member.email} is now ${member.role === "admin" ? "an" : "a"} ${member.role}`,
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
};

export const useRemoveProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectMembersApi.remove(projectId, id),
    onSuccess: (_, id) => {
      const email = findCached<ProjectMember>(
        queryClient,
        queryKeys.projectMembers.all(projectId),
        id,
      )?.email;
      notify(email ? `${email} removed from project` : "Member removed");
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMembers.all(projectId),
      });
    },
  });
};
