import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/projectMembers/api', () => ({
  projectMemberQueries: {
    all: vi.fn((projectId: string) => ({
      queryKey: ['projects', projectId, 'members'],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
  },
  projectMembersApi: { add: vi.fn(), remove: vi.fn() },
}));

vi.mock('@/lib/notify', () => ({ notify: vi.fn() }));

import { queryKeys } from '@/api/queryKeys';
import {
  projectMemberQueries,
  projectMembersApi,
} from '@/features/projectMembers/api';
import {
  useAddProjectMember,
  useProjectMembers,
  useRemoveProjectMember,
} from '@/features/projectMembers/hooks';
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

describe('useProjectMembers', () => {
  it('calls the query factory scoped to the project', () => {
    const { wrapper } = makeWrapper();

    renderHook(() => useProjectMembers('p1'), { wrapper });

    expect(projectMemberQueries.all).toHaveBeenCalledWith('p1');
  });
});

describe('useAddProjectMember', () => {
  it('calls the API, notifies, and invalidates the members list', async () => {
    vi.mocked(projectMembersApi.add).mockResolvedValue({ id: 'm1' } as any);
    const { queryClient, wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.projectMembers.all('p1'), []);

    const { result } = renderHook(() => useAddProjectMember('p1'), {
      wrapper,
    });
    result.current.mutate({ userId: 'u1', role: 'Editor' } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(projectMembersApi.add).toHaveBeenCalledWith('p1', {
      userId: 'u1',
      role: 'Editor',
    });
    expect(notify).toHaveBeenCalledWith('Member added');
    expect(
      queryClient.getQueryState(queryKeys.projectMembers.all('p1'))
        ?.isInvalidated,
    ).toBe(true);
  });
});

describe('useRemoveProjectMember', () => {
  it('calls the API, notifies, and invalidates the members list', async () => {
    vi.mocked(projectMembersApi.remove).mockResolvedValue(undefined as any);
    const { queryClient, wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.projectMembers.all('p1'), []);

    const { result } = renderHook(() => useRemoveProjectMember('p1'), {
      wrapper,
    });
    result.current.mutate('m1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(projectMembersApi.remove).toHaveBeenCalledWith('p1', 'm1');
    expect(notify).toHaveBeenCalledWith('Member removed');
    expect(
      queryClient.getQueryState(queryKeys.projectMembers.all('p1'))
        ?.isInvalidated,
    ).toBe(true);
  });
});
