import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/testPlans', () => ({
  testPlanQueries: {
    all: vi.fn((projectId: string) => ({
      queryKey: ['projects', projectId, 'plans'],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
    detail: vi.fn((projectId: string, planId: string) => ({
      queryKey: ['projects', projectId, 'plans', planId],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
    cases: vi.fn((projectId: string, planId: string) => ({
      queryKey: ['projects', projectId, 'plans', planId, 'cases'],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
  },
  testPlansApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addCase: vi.fn(),
    removeCase: vi.fn(),
    reorderCases: vi.fn(),
    createRun: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({ notify: vi.fn() }));

import { testPlanQueries, testPlansApi } from '@/api/testPlans';
import {
  useAddCaseToPlan,
  useCreateRunFromPlan,
  useCreateTestPlan,
  useDeleteTestPlan,
  useRemoveCaseFromPlan,
  useReorderPlanCases,
  useTestPlan,
  useTestPlanCases,
  useTestPlans,
  useUpdateTestPlan,
} from '@/hooks/useTestPlans';
import { notify } from '@/lib/notify';

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTestPlans', () => {
  describe('given a projectId — calls the query factory', () => {
    it('calls testPlanQueries.all with the projectId', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestPlans('proj-1'), { wrapper });
      expect(testPlanQueries.all).toHaveBeenCalledWith('proj-1');
    });
  });
});

describe('useTestPlan', () => {
  describe('given projectId and planId — calls the detail query factory', () => {
    it('calls testPlanQueries.detail with both ids', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestPlan('proj-1', 'plan-1'), { wrapper });
      expect(testPlanQueries.detail).toHaveBeenCalledWith('proj-1', 'plan-1');
    });
  });
});

describe('useTestPlanCases', () => {
  describe('given projectId and planId — calls the cases query factory', () => {
    it('calls testPlanQueries.cases with both ids', () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useTestPlanCases('proj-1', 'plan-1'), { wrapper });
      expect(testPlanQueries.cases).toHaveBeenCalledWith('proj-1', 'plan-1');
    });
  });
});

describe('useCreateTestPlan', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls testPlansApi.create with projectId and input', async () => {
      vi.mocked(testPlansApi.create).mockResolvedValue({
        id: 'plan-1',
        name: 'Sprint 1',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateTestPlan('proj-1'), {
        wrapper,
      });

      result.current.mutate({ name: 'Sprint 1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testPlansApi.create).toHaveBeenCalledWith('proj-1', {
        name: 'Sprint 1',
      });
    });

    it("notifies 'Test plan created' on success", async () => {
      vi.mocked(testPlansApi.create).mockResolvedValue({
        id: 'plan-1',
        name: 'Sprint 1',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateTestPlan('proj-1'), {
        wrapper,
      });

      result.current.mutate({ name: 'Sprint 1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Test plan created');
    });
  });
});

describe('useUpdateTestPlan', () => {
  describe('on mutate — calls API with stripped input', () => {
    it('calls testPlansApi.update with projectId, planId, and update payload', async () => {
      vi.mocked(testPlansApi.update).mockResolvedValue({
        id: 'plan-1',
        name: 'Sprint 2',
      } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useUpdateTestPlan('proj-1'), {
        wrapper,
      });

      result.current.mutate({ id: 'plan-1', name: 'Sprint 2' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testPlansApi.update).toHaveBeenCalledWith('proj-1', 'plan-1', {
        name: 'Sprint 2',
      });
    });
  });
});

describe('useDeleteTestPlan', () => {
  describe('on mutate — calls API and notifies', () => {
    it('calls testPlansApi.delete with projectId and planId', async () => {
      vi.mocked(testPlansApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteTestPlan('proj-1'), {
        wrapper,
      });

      result.current.mutate('plan-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testPlansApi.delete).toHaveBeenCalledWith('proj-1', 'plan-1');
    });

    it("notifies 'Test plan deleted' on success", async () => {
      vi.mocked(testPlansApi.delete).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDeleteTestPlan('proj-1'), {
        wrapper,
      });

      result.current.mutate('plan-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Test plan deleted');
    });
  });
});

describe('useAddCaseToPlan', () => {
  describe('on mutate — calls addCase API', () => {
    it('calls testPlansApi.addCase with projectId, planId, and caseId', async () => {
      vi.mocked(testPlansApi.addCase).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useAddCaseToPlan('proj-1', 'plan-1'),
        { wrapper },
      );

      result.current.mutate('case-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testPlansApi.addCase).toHaveBeenCalledWith(
        'proj-1',
        'plan-1',
        'case-1',
      );
    });
  });
});

describe('useRemoveCaseFromPlan', () => {
  describe('on mutate — calls removeCase API', () => {
    it('calls testPlansApi.removeCase with projectId, planId, and caseId', async () => {
      vi.mocked(testPlansApi.removeCase).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useRemoveCaseFromPlan('proj-1', 'plan-1'),
        { wrapper },
      );

      result.current.mutate('case-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testPlansApi.removeCase).toHaveBeenCalledWith(
        'proj-1',
        'plan-1',
        'case-1',
      );
    });
  });
});

describe('useReorderPlanCases', () => {
  describe('on mutate — calls reorderCases API', () => {
    it('calls testPlansApi.reorderCases with projectId, planId, and ordered cases', async () => {
      vi.mocked(testPlansApi.reorderCases).mockResolvedValue(undefined as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(
        () => useReorderPlanCases('proj-1', 'plan-1'),
        { wrapper },
      );

      const cases = [
        { testCaseId: 'case-1', order: 1 },
        { testCaseId: 'case-2', order: 2 },
      ];
      result.current.mutate(cases);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testPlansApi.reorderCases).toHaveBeenCalledWith(
        'proj-1',
        'plan-1',
        cases,
      );
    });
  });
});

describe('useCreateRunFromPlan', () => {
  describe('on mutate — calls createRun API and notifies', () => {
    it('calls testPlansApi.createRun with the plan and run details', async () => {
      vi.mocked(testPlansApi.createRun).mockResolvedValue({ id: 'r1' } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateRunFromPlan('proj-1'), {
        wrapper,
      });

      result.current.mutate({
        planId: 'plan-1',
        name: 'Sprint 1 Run',
        environment: 'staging',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(testPlansApi.createRun).toHaveBeenCalledWith('proj-1', 'plan-1', {
        name: 'Sprint 1 Run',
        environment: 'staging',
      });
    });

    it("notifies 'Test run created from plan' on success", async () => {
      vi.mocked(testPlansApi.createRun).mockResolvedValue({ id: 'r1' } as any);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useCreateRunFromPlan('proj-1'), {
        wrapper,
      });

      result.current.mutate({
        planId: 'plan-1',
        name: 'Sprint 1 Run',
        environment: 'staging',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(notify).toHaveBeenCalledWith('Test run created from plan');
    });
  });
});
