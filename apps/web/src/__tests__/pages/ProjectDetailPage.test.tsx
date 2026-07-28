import { render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children?: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  Outlet: () => null,
}));

vi.mock('@/hooks/useRequiredParam', () => ({
  useRequiredParam: vi.fn().mockReturnValue('proj-1'),
}));

vi.mock('@/hooks/useProjects', () => ({
  useProject: vi.fn(),
}));

vi.mock('@/hooks/useBreadcrumbs', () => ({ useBreadcrumbs: vi.fn() }));

vi.mock('@/pages/ProjectDetailPage/SuitesTab', () => ({
  SuitesTab: vi.fn(() => <div data-testid="suites-section" />),
}));

vi.mock('@/pages/ProjectDetailPage/RunsTab', () => ({
  RunsTab: vi.fn(() => <div data-testid="runs-section" />),
}));

import { useProject } from '@/hooks/useProjects';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage/ProjectDetailPage';

const makeProject = () => ({
  id: 'proj-1',
  name: 'Alpha',
  description: 'An alpha project',
  suiteCount: 3,
  runCount: 2,
  createdAt: '2026-01-15',
  updatedAt: '2026-01-15',
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProjectDetailPage', () => {
  describe('loading state — renders page shell immediately', () => {
    it('renders the tab links while project is loading', () => {
      vi.mocked(useProject).mockReturnValue({
        data: undefined,
        isPending: true,
        isError: false,
      } as unknown as ReturnType<typeof useProject>);
      render(<ProjectDetailPage />);

      expect(
        screen.getByRole('link', { name: /test runs/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /test suites/i }),
      ).toBeInTheDocument();
    });
  });

  describe('not found state — shows error message', () => {
    it('renders project not found', () => {
      vi.mocked(useProject).mockReturnValue({
        data: undefined,
        isPending: false,
        isError: false,
      } as unknown as ReturnType<typeof useProject>);
      render(<ProjectDetailPage />);
      expect(screen.getByText('Project not found')).toBeInTheDocument();
    });
  });

  describe('with project data — renders the project', () => {
    it('displays the project name as heading', () => {
      vi.mocked(useProject).mockReturnValue({
        data: makeProject(),
        isPending: false,
        isError: false,
      } as unknown as ReturnType<typeof useProject>);
      render(<ProjectDetailPage />);
      expect(
        screen.getByRole('heading', { name: 'Alpha' }),
      ).toBeInTheDocument();
    });

    it('renders the Test Suites tab link', () => {
      vi.mocked(useProject).mockReturnValue({
        data: makeProject(),
        isPending: false,
        isError: false,
      } as unknown as ReturnType<typeof useProject>);
      render(<ProjectDetailPage />);
      expect(
        screen.getByRole('link', { name: /test suites/i }),
      ).toBeInTheDocument();
    });

    it('renders the Test Runs tab link', () => {
      vi.mocked(useProject).mockReturnValue({
        data: makeProject(),
        isPending: false,
        isError: false,
      } as unknown as ReturnType<typeof useProject>);
      render(<ProjectDetailPage />);
      expect(
        screen.getByRole('link', { name: /test runs/i }),
      ).toBeInTheDocument();
    });
  });
});
