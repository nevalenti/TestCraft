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

vi.mock('@/hooks/useRequiredParam', () => ({
  useRequiredParam: vi.fn((key: string) => `${key}-1`),
}));

vi.mock('@/hooks/useProjects', () => ({
  useProject: vi.fn(),
}));

vi.mock('@/hooks/useTestSuites', () => ({
  useTestSuite: vi.fn(),
}));

vi.mock('@/hooks/useTestCases', () => ({
  useTestCase: vi.fn(),
}));

vi.mock('@/hooks/useTestCaseSteps', () => ({
  useTestCaseSteps: vi.fn(),
  useCreateTestCaseStep: vi.fn(),
  useUpdateTestCaseStep: vi.fn(),
  useBulkReorderSteps: vi.fn(),
  useDeleteTestCaseStep: vi.fn(),
}));

vi.mock('@/hooks/useBreadcrumbs', () => ({ useBreadcrumbs: vi.fn() }));

import type { TestCaseStep } from '@testcraft/types';

import { useProject } from '@/hooks/useProjects';
import { useTestCase } from '@/hooks/useTestCases';
import {
  useBulkReorderSteps,
  useCreateTestCaseStep,
  useDeleteTestCaseStep,
  useTestCaseSteps,
  useUpdateTestCaseStep,
} from '@/hooks/useTestCaseSteps';
import { useTestSuite } from '@/hooks/useTestSuites';
import { TestCasePage } from '@/pages/TestCasePage/TestCasePage';

const makeStep = (overrides: Partial<TestCaseStep> = {}): TestCaseStep => ({
  id: 'step-1',
  testCaseId: 'caseId-1',
  order: 1,
  action: 'Click login',
  expectedResult: 'User is redirected to the dashboard',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
  ...overrides,
});

const createStepMutate = vi.fn();
const updateStepMutate = vi.fn();
const bulkReorderMutate = vi.fn();
const deleteStepMutate = vi.fn();

const setupMocks = ({
  steps = [] as TestCaseStep[] | undefined,
  isPending = false,
  isError = false,
  error = undefined as unknown,
} = {}) => {
  vi.mocked(useProject).mockReturnValue({
    data: { id: 'proj-1', name: 'My Project' },
    isPending: false,
  } as unknown as ReturnType<typeof useProject>);

  vi.mocked(useTestSuite).mockReturnValue({
    data: { id: 'suite-1', name: 'Auth' },
    isPending: false,
  } as unknown as ReturnType<typeof useTestSuite>);

  vi.mocked(useTestCase).mockReturnValue({
    data: undefined,
    isPending: false,
  } as unknown as ReturnType<typeof useTestCase>);

  vi.mocked(useTestCaseSteps).mockReturnValue({
    data: steps,
    isPending,
    isError,
    error,
  } as unknown as ReturnType<typeof useTestCaseSteps>);

  vi.mocked(useCreateTestCaseStep).mockReturnValue({
    mutate: createStepMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateTestCaseStep>);
  vi.mocked(useUpdateTestCaseStep).mockReturnValue({
    mutate: updateStepMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateTestCaseStep>);
  vi.mocked(useBulkReorderSteps).mockReturnValue({
    mutate: bulkReorderMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useBulkReorderSteps>);
  vi.mocked(useDeleteTestCaseStep).mockReturnValue({
    mutate: deleteStepMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteTestCaseStep>);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TestCasePage', () => {
  describe('loading state — shows spinner', () => {
    it('renders a loading spinner when isPending', () => {
      setupMocks({ steps: undefined, isPending: true });
      const { container } = render(<TestCasePage />);
      expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    });
  });

  describe('error state — shows an error instead of the empty state', () => {
    it('renders the failure message when the steps query errors', () => {
      setupMocks({ steps: undefined, isError: true });
      render(<TestCasePage />);
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.queryByText('No steps defined')).not.toBeInTheDocument();
    });
  });

  describe('empty state — prompts to add steps', () => {
    it('shows the no-steps message', () => {
      setupMocks({ steps: [] });
      render(<TestCasePage />);
      expect(screen.getByText('No steps defined')).toBeInTheDocument();
    });
  });

  describe('with steps — renders each one', () => {
    it('displays the action and expected result for every step', () => {
      setupMocks({
        steps: [
          makeStep({ id: 'step-1', action: 'Click login' }),
          makeStep({
            id: 'step-2',
            order: 2,
            action: 'Enter password',
            expectedResult: 'Password field accepts input',
          }),
        ],
      });
      render(<TestCasePage />);
      expect(screen.getByText('Click login')).toBeInTheDocument();
      expect(screen.getByText('Enter password')).toBeInTheDocument();
      expect(
        screen.getByText('Password field accepts input'),
      ).toBeInTheDocument();
    });
  });

  describe('Add Step button — opens the create modal', () => {
    it('shows the Add Step modal heading on click', async () => {
      setupMocks({ steps: [makeStep()] });
      render(<TestCasePage />);
      await userEvent.click(
        screen.getAllByRole('button', { name: /Add Step/i })[0],
      );
      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: 'Add Step' }),
        ).toBeInTheDocument(),
      );
    });
  });

  describe('edit action — opens the edit modal', () => {
    it('shows the Edit Step modal heading on click', async () => {
      setupMocks({ steps: [makeStep()] });
      render(<TestCasePage />);
      await userEvent.click(screen.getByRole('button', { name: 'Edit step' }));
      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: 'Edit Step' }),
        ).toBeInTheDocument(),
      );
    });
  });

  describe('delete action — opens the confirm dialog and calls delete', () => {
    it('calls deleteStep.mutate with the step id on confirm', async () => {
      setupMocks({ steps: [makeStep({ id: 'step-1' })] });
      render(<TestCasePage />);
      await userEvent.click(
        screen.getByRole('button', { name: 'Delete step' }),
      );
      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: 'Delete Step' }),
        ).toBeInTheDocument(),
      );
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      expect(deleteStepMutate).toHaveBeenCalledWith(
        'step-1',
        expect.anything(),
      );
    });
  });
});
