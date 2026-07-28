import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

vi.mock('@/hooks/useRequiredParam', () => ({
  useRequiredParam: vi.fn().mockReturnValue('proj-1'),
}));

vi.mock('@/hooks/useProjects', () => ({
  useProject: vi.fn(),
}));

vi.mock('@/hooks/useTestPlans', () => ({
  useTestPlans: vi.fn(),
  useCreateTestPlan: vi.fn(),
  useUpdateTestPlan: vi.fn(),
  useDeleteTestPlan: vi.fn(),
}));

vi.mock('@/hooks/useBreadcrumbs', () => ({ useBreadcrumbs: vi.fn() }));

import type { TestPlan } from '@testcraft/types';

import { useProject } from '@/hooks/useProjects';
import {
  useCreateTestPlan,
  useDeleteTestPlan,
  useTestPlans,
  useUpdateTestPlan,
} from '@/hooks/useTestPlans';
import { TestPlansPage } from '@/pages/TestPlansPage/TestPlansPage';

const makePlan = (overrides: Partial<TestPlan> = {}): TestPlan => ({
  id: 'plan-1',
  projectId: 'proj-1',
  name: 'Sprint 1',
  caseCount: 0,
  createdAt: '2026-01-15T00:00:00.000Z',
  ...overrides,
});

const noopMutation = { mutate: vi.fn(), isPending: false };

const setupMocks = (plans: TestPlan[] | undefined = [], isPending = false) => {
  vi.mocked(useProject).mockReturnValue({
    data: { id: 'proj-1', name: 'My Project' },
    isPending: false,
  } as unknown as ReturnType<typeof useProject>);

  vi.mocked(useTestPlans).mockReturnValue({
    data: plans,
    isPending,
  } as unknown as ReturnType<typeof useTestPlans>);

  vi.mocked(useCreateTestPlan).mockReturnValue(
    noopMutation as unknown as ReturnType<typeof useCreateTestPlan>,
  );
  vi.mocked(useUpdateTestPlan).mockReturnValue(
    noopMutation as unknown as ReturnType<typeof useUpdateTestPlan>,
  );
  vi.mocked(useDeleteTestPlan).mockReturnValue(
    noopMutation as unknown as ReturnType<typeof useDeleteTestPlan>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TestPlansPage', () => {
  describe('loading state — shows spinner', () => {
    it('renders a loading spinner when isPending', () => {
      setupMocks(undefined, true);
      const { container } = render(<TestPlansPage />);
      expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    });
  });

  describe('empty state — shows no plans message', () => {
    it('renders the empty state title', () => {
      setupMocks([]);
      render(<TestPlansPage />);
      expect(screen.getByText('No test plans yet')).toBeInTheDocument();
    });
  });

  describe('with plans — renders each plan', () => {
    it('displays plan names', () => {
      setupMocks([
        makePlan({ name: 'Sprint 1' }),
        makePlan({ id: 'plan-2', name: 'Regression' }),
      ]);
      render(<TestPlansPage />);
      expect(screen.getByText('Sprint 1')).toBeInTheDocument();
      expect(screen.getByText('Regression')).toBeInTheDocument();
    });

    it('shows plan description when present', () => {
      setupMocks([makePlan({ description: 'Core login flows' })]);
      render(<TestPlansPage />);
      expect(screen.getByText('Core login flows')).toBeInTheDocument();
    });

    it('shows case count in plan metadata', () => {
      setupMocks([makePlan({ caseCount: 5 })]);
      render(<TestPlansPage />);
      expect(screen.getByText(/5 cases/)).toBeInTheDocument();
    });
  });

  describe('New Plan button — is rendered', () => {
    it('shows the New Plan button', () => {
      setupMocks([]);
      render(<TestPlansPage />);
      expect(
        screen.getAllByRole('button', { name: /New Plan/i })[0],
      ).toBeInTheDocument();
    });
  });

  describe('New Plan button — opens the create modal', () => {
    it('shows the New Test Plan modal heading on click', async () => {
      setupMocks([makePlan()]);
      render(<TestPlansPage />);
      await userEvent.click(
        screen.getAllByRole('button', { name: /New Plan/i })[0],
      );
      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: 'New Test Plan' }),
        ).toBeInTheDocument(),
      );
    });
  });

  describe('edit button — opens the edit modal', () => {
    it('shows the Edit Test Plan modal heading on click', async () => {
      setupMocks([makePlan({ name: 'Sprint 1' })]);
      render(<TestPlansPage />);
      await userEvent.click(screen.getByRole('button', { name: 'Edit plan' }));
      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: 'Edit Test Plan' }),
        ).toBeInTheDocument(),
      );
    });
  });
});
