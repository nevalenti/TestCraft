import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AddProjectMember } from '@testcraft/types';

import { projectMemberQueries, projectMembersApi } from '@/api/projectMembers';
import { queryKeys } from '@/api/queryKeys';
import { notify } from '@/lib/notify';

export const useProjectMembers = (projectId: string) =>
  useQuery(projectMemberQueries.all(projectId));

export const useAddProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddProjectMember) =>
      projectMembersApi.add(projectId, input),
    onSuccess: () => {
      notify('Member added');
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
    onSuccess: () => {
      notify('Member removed');
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMembers.all(projectId),
      });
    },
  });
};
