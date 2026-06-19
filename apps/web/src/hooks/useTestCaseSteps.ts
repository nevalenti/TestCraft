import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BulkReorderSteps,
  CreateTestCaseStep,
  Paginated,
  TestCaseStep,
  UpdateTestCaseStep,
} from "@testcraft/types";
import { produce } from "immer";

import { queryKeys } from "@/api/queryKeys";
import { testCaseStepQueries, testCaseStepsApi } from "@/api/testCaseSteps";
import { notify } from "@/lib/notify";

export const useTestCaseSteps = (
  projectId: string,
  suiteId: string,
  caseId: string,
) =>
  useQuery({
    ...testCaseStepQueries.all(projectId, suiteId, caseId),
    select: (data) => data.items,
  });

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
    mutationFn: (input: CreateTestCaseStep) =>
      testCaseStepsApi.create(projectId, suiteId, caseId, input),
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
    mutationFn: ({ id, ...input }: UpdateTestCaseStep & { id: string }) =>
      testCaseStepsApi.update(projectId, suiteId, caseId, id, input),
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
  const queryKey = queryKeys.testCaseSteps.all(projectId, suiteId, caseId);

  return useMutation({
    mutationFn: (input: BulkReorderSteps) =>
      testCaseStepsApi.bulkReorder(projectId, suiteId, caseId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<Paginated<TestCaseStep>>(queryKey);

      queryClient.setQueryData<Paginated<TestCaseStep>>(
        queryKey,
        produce((draft) => {
          if (!draft) return;

          const orderMap = new Map(
            input.steps.map((step) => [step.id, step.order]),
          );

          for (const item of draft.items) {
            const next = orderMap.get(item.id);

            if (next !== undefined) item.order = next;
          }
        }),
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
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
