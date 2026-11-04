import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { CreateLabel, Label, UpdateLabel } from "@testcraft/types";

import { findCached } from "@/api/findCached";
import { queryKeys } from "@/api/queryKeys";
import { labelQueries, labelsApi } from "@/features/labels/api";
import { notify } from "@/lib/notify";

const invalidateLabelsAndDependents = (
  queryClient: QueryClient,
  projectId: string,
) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.labels.all(projectId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.testSuites.all(projectId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.testCases.byProject(projectId),
  });
};

const invalidateCaseLabels = (
  queryClient: QueryClient,
  projectId: string,
  suiteId: string,
) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.testCases.all(projectId, suiteId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.testCases.byProject(projectId),
  });
};

export const useLabels = (projectId: string) =>
  useQuery(labelQueries.all(projectId));

export const useLabelsPage = (
  projectId: string,
  page: number,
  search: string,
) => useQuery(labelQueries.page(projectId, page, search));

export const useCreateLabel = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLabel) => labelsApi.create(projectId, input),
    onSuccess: (_, input) => {
      notify(`Label "${input.name}" created`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.labels.all(projectId),
      });
    },
  });
};

export const useUpdateLabel = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      version,
      ...input
    }: UpdateLabel & {
      id: string;
      version: number;
    }) => labelsApi.update(projectId, id, input, version),
    onSuccess: (_, { name }) => {
      notify(`Label "${name}" updated`);
      invalidateLabelsAndDependents(queryClient, projectId);
    },
  });
};

export const useDeleteLabel = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => labelsApi.delete(projectId, id),
    onSuccess: (_, id) => {
      const name = findCached<Label>(
        queryClient,
        queryKeys.labels.all(projectId),
        id,
      )?.name;
      notify(name ? `Label "${name}" deleted` : "Label deleted");
      invalidateLabelsAndDependents(queryClient, projectId);
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
    onSuccess: (_, labelId) => {
      const name = findCached<Label>(
        queryClient,
        queryKeys.labels.all(projectId),
        labelId,
      )?.name;
      notify(name ? `Label "${name}" added` : "Label added");
      invalidateCaseLabels(queryClient, projectId, suiteId);
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
    onSuccess: (_, labelId) => {
      const name = findCached<Label>(
        queryClient,
        queryKeys.labels.all(projectId),
        labelId,
      )?.name;
      notify(name ? `Label "${name}" removed` : "Label removed");
      invalidateCaseLabels(queryClient, projectId, suiteId);
    },
  });
};
