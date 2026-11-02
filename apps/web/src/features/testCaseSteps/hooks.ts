import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTestCaseStep,
  Paginated,
  ReorderTestCaseSteps,
  TestCaseStep,
  UpdateTestCaseStep,
} from "@testcraft/types";
import { produce } from "immer";

import { queryKeys } from "@/api/queryKeys";
import {
  testCaseStepQueries,
  testCaseStepsApi,
} from "@/features/testCaseSteps/api";
import { truncate } from "@/lib/format";
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

export const useCreateTestCaseStep = (
  projectId: string,
  suiteId: string,
  caseId: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestCaseStep) =>
      testCaseStepsApi.create(projectId, suiteId, caseId, input),
    onSuccess: (_, input) => {
      notify(`Step "${truncate(input.action, 40)}" added`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.all(projectId, suiteId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.byProject(projectId),
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
    mutationFn: ({
      id,
      version,
      ...input
    }: UpdateTestCaseStep & {
      id: string;
      version: number;
    }) =>
      testCaseStepsApi.update(projectId, suiteId, caseId, id, input, version),
    onSuccess: (_, { action }) => {
      notify(`Step "${truncate(action, 40)}" updated`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCaseSteps.all(projectId, suiteId, caseId),
      });
    },
  });
};

export const useReorderTestCaseSteps = (
  projectId: string,
  suiteId: string,
  caseId: string,
) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.testCaseSteps.all(projectId, suiteId, caseId);

  return useMutation({
    mutationFn: (input: ReorderTestCaseSteps) =>
      testCaseStepsApi.reorder(projectId, suiteId, caseId, input),
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
      const action = queryClient
        .getQueryData<Paginated<TestCaseStep>>(
          queryKeys.testCaseSteps.all(projectId, suiteId, caseId),
        )
        ?.items.find((step) => step.id === id)?.action;
      notify(
        action ? `Step "${truncate(action, 40)}" deleted` : "Step deleted",
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.all(projectId, suiteId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.byProject(projectId),
      });
    },
  });
};
