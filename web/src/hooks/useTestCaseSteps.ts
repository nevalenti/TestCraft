import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { testCaseStepQueries, testCaseStepsApi } from "@/api/testCaseSteps";
import { queryKeys } from "@/api/queryKeys";
import type { CreateTestCaseStepDto, UpdateTestCaseStepDto } from "@/types";

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
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCaseSteps.all(projectId, suiteId, caseId),
      }),
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
