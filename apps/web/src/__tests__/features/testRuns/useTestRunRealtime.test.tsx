import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const handlersRef = vi.hoisted(() => ({ current: null as any }));

vi.mock('@/features/testRuns/useSignalR', () => ({
  useSignalR: vi.fn((_runId, handlers) => {
    handlersRef.current = handlers;
  }),
}));

import { queryKeys } from '@/api/queryKeys';
import { useSignalR } from '@/features/testRuns/useSignalR';
import { useTestRunRealtime } from '@/features/testRuns/useTestRunRealtime';

const makeWrapper = () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTestRunRealtime', () => {
  it('invalidates results and the run summary on ResultAdded', () => {
    const { queryClient, wrapper } = makeWrapper();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    renderHook(() => useTestRunRealtime('p1', 'r1'), { wrapper });

    handlersRef.current.ResultAdded();

    expect(spy).toHaveBeenCalledWith({
      queryKey: queryKeys.testResults.all('p1', 'r1'),
    });
    expect(spy).toHaveBeenCalledWith({
      queryKey: queryKeys.testRuns.summary('p1', 'r1'),
    });
  });

  it('invalidates only the run detail on RunStatusChanged', () => {
    const { queryClient, wrapper } = makeWrapper();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    renderHook(() => useTestRunRealtime('p1', 'r1'), { wrapper });
    spy.mockClear();

    handlersRef.current.RunStatusChanged();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      queryKey: queryKeys.testRuns.detail('p1', 'r1'),
    });
  });

  it('appends incoming log lines to the cached logs without dropping existing ones', () => {
    const { queryClient, wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.testRuns.logs('p1', 'r1'), ['line 1']);
    renderHook(() => useTestRunRealtime('p1', 'r1'), { wrapper });

    handlersRef.current.LogsAppended(['line 2', 'line 3']);

    expect(
      queryClient.getQueryData(queryKeys.testRuns.logs('p1', 'r1')),
    ).toEqual(['line 1', 'line 2', 'line 3']);
  });

  it('appends onto an empty cache when no logs were previously fetched', () => {
    const { queryClient, wrapper } = makeWrapper();
    renderHook(() => useTestRunRealtime('p1', 'r1'), { wrapper });

    handlersRef.current.LogsAppended(['first']);

    expect(
      queryClient.getQueryData(queryKeys.testRuns.logs('p1', 'r1')),
    ).toEqual(['first']);
  });

  it('ignores a non-array LogsAppended payload without touching the cache', () => {
    const { queryClient, wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.testRuns.logs('p1', 'r1'), ['line 1']);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderHook(() => useTestRunRealtime('p1', 'r1'), { wrapper });

    handlersRef.current.LogsAppended({ not: 'an array' });

    expect(
      queryClient.getQueryData(queryKeys.testRuns.logs('p1', 'r1')),
    ).toEqual(['line 1']);
  });

  it('ignores a LogsAppended payload with non-string entries without touching the cache', () => {
    const { queryClient, wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.testRuns.logs('p1', 'r1'), ['line 1']);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderHook(() => useTestRunRealtime('p1', 'r1'), { wrapper });

    handlersRef.current.LogsAppended(['ok', 42, null]);

    expect(
      queryClient.getQueryData(queryKeys.testRuns.logs('p1', 'r1')),
    ).toEqual(['line 1']);
  });

  it('invalidates results, summary, run detail, and logs on reconnect', () => {
    const { queryClient, wrapper } = makeWrapper();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    renderHook(() => useTestRunRealtime('p1', 'r1'), { wrapper });
    spy.mockClear();

    const onReconnect = vi.mocked(useSignalR).mock.calls[0][2] as () => void;

    onReconnect();

    expect(spy).toHaveBeenCalledWith({
      queryKey: queryKeys.testResults.all('p1', 'r1'),
    });
    expect(spy).toHaveBeenCalledWith({
      queryKey: queryKeys.testRuns.summary('p1', 'r1'),
    });
    expect(spy).toHaveBeenCalledWith({
      queryKey: queryKeys.testRuns.detail('p1', 'r1'),
    });
    expect(spy).toHaveBeenCalledWith({
      queryKey: queryKeys.testRuns.logs('p1', 'r1'),
    });
  });
});
