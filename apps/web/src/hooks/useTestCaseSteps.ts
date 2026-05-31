import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BulkReorderStepsInput,
  CreateTestCaseStepInput,
  Paginated,
  TestCaseStep,
  UpdateTestCaseStepInput,
} from "@testcraft/types";
import { produce } from "immer";

import { queryKeys } from "@/api/queryKeys";
import { testCaseStepQueries, testCaseStepsApi } from "@/api/testCaseSteps";
import { useNotificationsStore } from "@/stores/notifications";

const notify = (message: string) =>
  useNotificationsStore
    .getState()
    .add({ type: "success", message, timeout: 6000 });

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
    mutationFn: (input: CreateTestCaseStepInput) =>
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
    mutationFn: ({ id, ...input }: { id: string } & UpdateTestCaseStepInput) =>
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
    mutationFn: (input: BulkReorderStepsInput) =>
      testCaseStepsApi.bulkReorder(projectId, suiteId, caseId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<Paginated<TestCaseStep>>(queryKey);
      queryClient.setQueryData<Paginated<TestCaseStep>>(
        queryKey,
        produce((draft) => {
          if (!draft) return;
          const orderMap = new Map(input.steps.map((s) => [s.id, s.order]));
          for (const item of draft.items) {
            const next = orderMap.get(item.id);
            if (next !== undefined) item.order = next;
          }
        }),
      );
      return { previous };
    },
    onError: (_err, _dto, context) => {
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
