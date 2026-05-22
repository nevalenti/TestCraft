import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys";
import { testCaseStepQueries, testCaseStepsApi } from "@/api/testCaseSteps";
import { useNotificationsStore } from "@/stores/notifications";
import type {
  BulkReorderStepsDto,
  CreateTestCaseStepDto,
  UpdateTestCaseStepDto,
} from "@/types";

const notify = (message: string) =>
  useNotificationsStore
    .getState()
    .add({ type: "success", message, timeout: 3000 });

export const useTestCaseSteps = (
  projectId: string,
  suiteId: string,
  caseId: string,
) => useQuery(testCaseStepQueries.all(projectId, suiteId, caseId));

export const useTestCaseStep = (
  projectId: string,
  suiteId: string,
  caseId: string,
  id: string,
) => useQuery(testCaseStepQueries.detail(projectId, suiteId, caseId, id));

export const useCreateTestCaseStep = (
  projectId: string,
  suiteId: string,
  caseId: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTestCaseStepDto) =>
      testCaseStepsApi.create(projectId, suiteId, caseId, dto),
    onSuccess: () => {
      notify("Step added");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCaseSteps.all(projectId, suiteId, caseId),
      });
    },
  });
};

export const useUpdateTestCaseStep = (
  projectId: string,
  suiteId: string,
  caseId: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateTestCaseStepDto) =>
      testCaseStepsApi.update(projectId, suiteId, caseId, id, dto),
    onSuccess: (_, { id }) => {
      notify("Step updated");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCaseSteps.all(projectId, suiteId, caseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCaseSteps.detail(
          projectId,
          suiteId,
          caseId,
          id,
        ),
      });
    },
  });
};

export const useBulkReorderSteps = (
  projectId: string,
  suiteId: string,
  caseId: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkReorderStepsDto) =>
      testCaseStepsApi.bulkReorder(projectId, suiteId, caseId, dto),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCaseSteps.all(projectId, suiteId, caseId),
      }),
  });
};

export const useDeleteTestCaseStep = (
  projectId: string,
  suiteId: string,
  caseId: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      testCaseStepsApi.delete(projectId, suiteId, caseId, id),
    onSuccess: (_, id) => {
      notify("Step deleted");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCaseSteps.all(projectId, suiteId, caseId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.testCaseSteps.detail(
          projectId,
          suiteId,
          caseId,
          id,
        ),
      });
    },
  });
};
