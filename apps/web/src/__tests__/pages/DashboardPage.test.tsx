import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children?: React.ReactNode;
    to: string;
    className?: string;
    params?: unknown;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();

  return { ...actual, useQueries: vi.fn() };
});

vi.mock('@/hooks/useProjects', () => ({
  useProjects: vi.fn(),
}));

vi.mock('@/hooks/useBreadcrumbs', () => ({ useBreadcrumbs: vi.fn() }));

import { useQueries } from '@tanstack/react-query';
import { TestRunStatus } from '@testcraft/types';

import { useProjects } from '@/hooks/useProjects';
import { DashboardPage } from '@/pages/DashboardPage/DashboardPage';

const makeProject = (id: string, name: string) => ({
  id,
  userId: 'user-1',
  name,
  description: null,
  suiteCount: 2,
  runCount: 1,
  createdAt: '2026-01-15',
  updatedAt: '2026-01-15',
});

const makeRun = (id: string, projectId: string, status: TestRunStatus) => ({
  id,
  projectId,
  name: `Run ${id}`,
  environment: 'staging',
  status,
  executedById: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

const setupMocks = ({
  projects = [makeProject('proj-1', 'Alpha')],
  projectsPending = false,
  activeRuns = [] as ReturnType<typeof makeRun>[],
  recentlyCompletedRuns = [] as ReturnType<typeof makeRun>[],
  runsPending = false,
} = {}) => {
  vi.mocked(useProjects).mockReturnValue({
    data: projects,
    isPending: projectsPending,
    isError: false,
  } as unknown as ReturnType<typeof useProjects>);

  vi.mocked(useQueries).mockImplementation(
    (options: Parameters<typeof useQueries>[0]) => {
      let probe: unknown;
      try {
        probe = (options as { combine?: (r: unknown[]) => unknown }).combine?.(
          [],
        );
      } catch {
        probe = null;
      }
      if (probe !== null && typeof probe === 'object' && 'runs' in probe) {
        return {
          runs: [...activeRuns, ...recentlyCompletedRuns],
          total: activeRuns.length + recentlyCompletedRuns.length,
          isPending: runsPending,
        } as unknown as ReturnType<typeof useQueries>;
      }
      return new Map() as unknown as ReturnType<typeof useQueries>;
    },
  );
};

describe('DashboardPage', () => {
  describe('renders section headers', () => {
    it('shows the Active Runs section heading', () => {
      setupMocks();
      render(<DashboardPage />);
      expect(
        screen.getByRole('heading', { name: 'Active Runs' }),
      ).toBeInTheDocument();
    });
  });

  describe('stat cards — display counts', () => {
    it('shows the correct project count', () => {
      setupMocks({
        projects: [makeProject('p1', 'A'), makeProject('p2', 'B')],
      });
      render(<DashboardPage />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('loading state — shows spinner', () => {
    it('renders loading spinner for stats when projects are pending', () => {
      setupMocks({ projectsPending: true });
      render(<DashboardPage />);
      expect(
        document.querySelectorAll('.loading-spinner').length,
      ).toBeGreaterThan(0);
    });
  });

  describe('empty runs — shows the no active runs message', () => {
    it('renders the no active runs placeholder', () => {
      setupMocks({ activeRuns: [] });
      render(<DashboardPage />);
      expect(screen.getByText('No active runs')).toBeInTheDocument();
    });
  });

  describe('with active runs — renders each run', () => {
    it('displays the run name', () => {
      const run = makeRun('run-1', 'proj-1', TestRunStatus.Active);

      setupMocks({
        projects: [makeProject('proj-1', 'Alpha')],
        activeRuns: [run],
      });
      render(<DashboardPage />);
      expect(screen.getByText('Run run-1')).toBeInTheDocument();
    });
  });
});
