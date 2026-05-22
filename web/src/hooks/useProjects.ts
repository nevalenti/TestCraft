import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { projectQueries, projectsApi } from "@/api/projects";
import { queryKeys } from "@/api/queryKeys";
import { useNotificationsStore } from "@/stores/notifications";
import type { CreateProjectDto, UpdateProjectDto } from "@/types";

const notify = (message: string) =>
  useNotificationsStore
    .getState()
    .add({ type: "success", message, timeout: 3000 });

export const useProjects = (search?: string) =>
  useQuery(projectQueries.all(search));

export const useProject = (id: string) => useQuery(projectQueries.detail(id));

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProjectDto) => projectsApi.create(dto),
    onSuccess: () => {
      notify("Project created");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateProjectDto) =>
      projectsApi.update(id, dto),
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
