import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateLabel, UpdateLabel } from "@testcraft/types";

import { labelQueries, labelsApi } from "@/api/labels";
import { queryKeys } from "@/api/queryKeys";
import { notify } from "@/lib/notify";

export const useLabels = (projectId: string) =>
  useQuery(labelQueries.all(projectId));

export const useCreateLabel = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLabel) => labelsApi.create(projectId, input),
    onSuccess: () => {
      notify("Label created");
      queryClient.invalidateQueries({
        queryKey: queryKeys.labels.all(projectId),
      });
    },
  });
};

export const useUpdateLabel = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateLabel & { id: string }) =>
      labelsApi.update(projectId, id, input),
    onSuccess: () => {
      notify("Label updated");
      queryClient.invalidateQueries({
        queryKey: queryKeys.labels.all(projectId),
      });
    },
  });
};

export const useDeleteLabel = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => labelsApi.delete(projectId, id),
    onSuccess: () => {
      notify("Label deleted");
      queryClient.invalidateQueries({
        queryKey: queryKeys.labels.all(projectId),
      });
    },
  });
};

export const useAddTestCaseLabel = (
  projectId: string,
  suiteId: string,
  caseId: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: string) =>
      labelsApi.addToCase(projectId, caseId, labelId),
    onSuccess: () => {
      notify("Label added");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.detail(projectId, suiteId, caseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.all(projectId, suiteId),
      });
    },
  });
};

export const useRemoveTestCaseLabel = (
  projectId: string,
  suiteId: string,
  caseId: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: string) =>
      labelsApi.removeFromCase(projectId, caseId, labelId),
    onSuccess: () => {
      notify("Label removed");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.detail(projectId, suiteId, caseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.all(projectId, suiteId),
      });
    },
  });
};
