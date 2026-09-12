import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTestPlan,
  TestPlan,
  UpdateTestPlan,
} from '@testcraft/types';

import { queryKeys } from '@/api/queryKeys';
import { testPlanQueries, testPlansApi } from '@/features/testPlans/api';
import { notify } from '@/lib/notify';

export const useTestPlans = (projectId: string) =>
  useQuery(testPlanQueries.all(projectId));

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
    mutationFn: ({ id, ...input }: UpdateTestPlan & { id: string }) =>
      testPlansApi.update(projectId, id, input),
    onSuccess: (_, { id, name }) => {
      notify(`Test plan "${name}" updated`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.testPlans.all(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testPlans.detail(projectId, id),
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
      notify(name ? `Test plan "${name}" deleted` : 'Test plan deleted');
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
        queryKey: queryKeys.testPlans.cases(projectId, planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testPlans.detail(projectId, planId),
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
        queryKey: queryKeys.testPlans.cases(projectId, planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testPlans.detail(projectId, planId),
      });
    },
  });
};

export const useReorderPlanCases = (projectId: string, planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cases: { testCaseId: string; order: number }[]) =>
      testPlansApi.reorderCases(projectId, planId, cases),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testPlans.cases(projectId, planId),
      });
    },
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
    },
  });
};
