import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTestCase,
  Paginated,
  TestCase,
  UpdateTestCase,
} from '@testcraft/types';

import { queryKeys } from '@/api/queryKeys';
import { testCaseQueries, testCasesApi } from '@/features/testCases/api';
import { notify } from '@/lib/notify';

export const useProjectTestCases = (projectId: string) =>
  useQuery({
    ...testCaseQueries.byProject(projectId),
    select: (data) => data.items,
  });

export const useTestCases = (
  projectId: string,
  suiteId: string,
  search?: string,
) =>
  useQuery({
    ...testCaseQueries.all(projectId, suiteId, search),
    select: (data) => data.items,
  });

export const useTestCase = (projectId: string, suiteId: string, id: string) =>
  useQuery(testCaseQueries.detail(projectId, suiteId, id));

export const useCreateTestCase = (projectId: string, suiteId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestCase) =>
      testCasesApi.create(projectId, suiteId, input),
    onSuccess: (_, input) => {
      notify(`Test case "${input.name}" created`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.all(projectId, suiteId),
      });
    },
  });
};

export const useUpdateTestCase = (projectId: string, suiteId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTestCase & { id: string }) =>
      testCasesApi.update(projectId, suiteId, id, input),
    onSuccess: (_, { id, name }) => {
      notify(`Test case "${name}" updated`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.all(projectId, suiteId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.detail(projectId, suiteId, id),
      });
    },
  });
};

export const useDeleteTestCase = (projectId: string, suiteId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => testCasesApi.delete(projectId, suiteId, id),
    onSuccess: (_, id) => {
      const name = queryClient
        .getQueryData<
          Paginated<TestCase>
        >(queryKeys.testCases.all(projectId, suiteId))
        ?.items.find((testCase) => testCase.id === id)?.name;
      notify(name ? `Test case "${name}" deleted` : 'Test case deleted');
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.all(projectId, suiteId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.testCases.detail(projectId, suiteId, id),
      });
    },
  });
};
