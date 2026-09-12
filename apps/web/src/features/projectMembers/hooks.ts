import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AddProjectMember, ProjectMember } from '@testcraft/types';

import { queryKeys } from '@/api/queryKeys';
import {
  projectMemberQueries,
  projectMembersApi,
} from '@/features/projectMembers/api';
import { notify } from '@/lib/notify';

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

export const useRemoveProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectMembersApi.remove(projectId, id),
    onSuccess: (_, id) => {
      const email = queryClient
        .getQueryData<ProjectMember[]>(queryKeys.projectMembers.all(projectId))
        ?.find((member) => member.id === id)?.email;
      notify(email ? `${email} removed from project` : 'Member removed');
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMembers.all(projectId),
      });
    },
  });
};
