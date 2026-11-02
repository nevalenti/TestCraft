import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTestPlan,
  TestPlan,
  TestPlanCase,
  UpdateTestPlan,
} from "@testcraft/types";

import { queryKeys } from "@/api/queryKeys";
import { testPlanQueries, testPlansApi } from "@/features/testPlans/api";
import { notify } from "@/lib/notify";

export const useTestPlansPage = (
  projectId: string,
  page: number,
  search: string,
  sortBy: "name" | "created_at",
  sortDir: "asc" | "desc",
) => useQuery(testPlanQueries.page(projectId, page, search, sortBy, sortDir));

export const useTestPlan = (projectId: string, planId: string) =>
  useQuery(testPlanQueries.detail(projectId, planId));

export const useTestPlanCases = (projectId: string, planId: string) =>
  useQuery(testPlanQueries.cases(projectId, planId));

export const useCreateTestPlan = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestPlan) =>
      testPlansApi.create(projectId, input),
    onSuccess: (_, input) => {
      notify(`Test plan "${input.name}" created`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.testPlans.all(projectId),
      });
    },
  });
};

export const useUpdateTestPlan = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      version,
      ...input
    }: UpdateTestPlan & {
      id: string;
      version: number;
    }) => testPlansApi.update(projectId, id, input, version),
    onSuccess: (_, { name }) => {
      notify(`Test plan "${name}" updated`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.testPlans.all(projectId),
      });
    },
  });
};

export const useDeleteTestPlan = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => testPlansApi.delete(projectId, id),
    onSuccess: (_, id) => {
      const name = queryClient
        .getQueryData<TestPlan[]>(queryKeys.testPlans.all(projectId))
        ?.find((plan) => plan.id === id)?.name;
      notify(name ? `Test plan "${name}" deleted` : "Test plan deleted");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testPlans.all(projectId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.testPlans.detail(projectId, id),
      });
    },
  });
};

export const useAddCaseToPlan = (projectId: string, planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (caseId: string) =>
      testPlansApi.addCase(projectId, planId, caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testPlans.all(projectId),
      });
    },
  });
};

export const useRemoveCaseFromPlan = (projectId: string, planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (caseId: string) =>
      testPlansApi.removeCase(projectId, planId, caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testPlans.all(projectId),
      });
    },
  });
};

export const useReorderPlanCases = (projectId: string, planId: string) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.testPlans.cases(projectId, planId);

  return useMutation({
    mutationFn: (cases: { test_case_id: string; order: number }[]) =>
      testPlansApi.reorderCases(projectId, planId, cases),
    onMutate: async (cases) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TestPlanCase[]>(queryKey);
      const orderMap = new Map(
        cases.map((planCase) => [planCase.test_case_id, planCase.order]),
      );

      queryClient.setQueryData<TestPlanCase[]>(queryKey, (current) =>
        current?.map((planCase) => ({
          ...planCase,
          order: orderMap.get(planCase.test_case_id) ?? planCase.order,
        })),
      );

      return { previous };
    },
    onError: (_error, _cases, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
};

export const useCreateRunFromPlan = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      name,
      environment,
    }: {
      planId: string;
      name: string;
      environment: string;
    }) => testPlansApi.createRun(projectId, planId, { name, environment }),
    onSuccess: (_, { name }) => {
      notify(`Test run "${name}" created from plan`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.all(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
        exact: true,
      });
    },
  });
};
