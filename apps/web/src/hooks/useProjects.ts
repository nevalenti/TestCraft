import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { CreateProject, UpdateProject } from "@testcraft/types";

import { projectQueries, projectsApi } from "@/api/projects";
import { queryKeys } from "@/api/queryKeys";
import { notify } from "@/lib/notify";

export const useProjects = (search?: string) =>
  useQuery({
    ...projectQueries.all(search),
    select: (data) => data.items,
    placeholderData: keepPreviousData,
  });

export const useProject = (id: string) => useQuery(projectQueries.detail(id));

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProject) => projectsApi.create(input),
    onSuccess: () => {
      notify("Project created");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateProject) =>
      projectsApi.update(id, input),
    onSuccess: (_, { id }) => {
      notify("Project updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(id),
      });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: (_, id) => {
      notify("Project deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(id) });
    },
  });
};
