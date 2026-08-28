import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
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
    ...rest
  }: {
    children?: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/hooks/useRequiredParam', () => ({
  useRequiredParam: vi.fn().mockReturnValue('proj-1'),
}));

vi.mock('@/features/testRuns/api', () => ({
  testRunQueries: {
    all: vi.fn((projectId: string, search?: string) => ({
      queryKey: ['projects', projectId, 'runs', search],
      queryFn: vi.fn().mockResolvedValue({ items: [] }),
    })),
    detail: vi.fn(() => ({
      queryKey: ['unused-detail'],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
    summary: vi.fn(() => ({
      queryKey: ['unused-summary'],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
  },
  testRunsApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/features/testRuns/resultImport/importsApi', () => ({
  importsApi: {
    junit: vi.fn(),
    allure: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({ notify: vi.fn() }));

import { testRunQueries, testRunsApi } from '@/features/testRuns/api';
import { importsApi } from '@/features/testRuns/resultImport/importsApi';
import { RunsTab } from '@/features/testRuns/RunsTab';
import { useViewModeStore } from '@/stores/viewMode';

const makeRun = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'r1',
  name: 'Sprint 42 Regression',
  environment: 'staging',
  status: 'Active',
  source: null,
  createdAt: '2026-01-10T00:00:00Z',
  ...overrides,
});

const renderWithClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<RunsTab />, { wrapper });
};

const mockRuns = (items: ReturnType<typeof makeRun>[]) => {
  vi.mocked(testRunQueries.all).mockImplementation(
    (projectId: string, search?: string) =>
      ({
        queryKey: ['projects', projectId, 'runs', search],
        queryFn: vi.fn().mockResolvedValue({ items }),
      }) as never,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  useViewModeStore.setState({ viewMode: 'grid' });
  mockRuns([]);
});

describe('RunsTab', () => {
  describe('given no runs — shows the empty state', () => {
    it('renders the empty-state copy', async () => {
      renderWithClient();
      expect(await screen.findByText('No test runs yet')).toBeInTheDocument();
    });
  });

  describe('given runs — renders a card per run', () => {
    it('shows each run name', async () => {
      mockRuns([
        makeRun({ id: 'r1', name: 'Sprint 42 Regression' }),
        makeRun({ id: 'r2', name: 'Nightly Smoke' }),
      ]);
      renderWithClient();

      expect(
        await screen.findByText('Sprint 42 Regression'),
      ).toBeInTheDocument();
      expect(screen.getByText('Nightly Smoke')).toBeInTheDocument();
    });
  });

  describe('given the view toggle — switches between grid and list', () => {
    it('marks list view as pressed after clicking it', async () => {
      mockRuns([makeRun()]);
      renderWithClient();
      await screen.findByText('Sprint 42 Regression');

      await userEvent.click(screen.getByRole('button', { name: /list view/i }));

      expect(
        screen.getByRole('button', { name: /list view/i }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getAllByTestId('run-card')).toHaveLength(1);
    });
  });

  describe('given a search term — debounces before refetching', () => {
    it('calls testRunQueries.all with the typed search after the debounce delay', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mockRuns([]);
      renderWithClient();

      const input = screen.getByPlaceholderText('Search test runs…');
      await userEvent.type(input, 'nightly', { delay: null });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      await waitFor(() =>
        expect(testRunQueries.all).toHaveBeenCalledWith('proj-1', 'nightly'),
      );
      vi.useRealTimers();
    });
  });

  describe('given source-tagged runs — filters by the selected source chip', () => {
    it('shows only runs matching the selected source', async () => {
      mockRuns([
        makeRun({ id: 'r1', name: 'From CI', source: 'ci' }),
        makeRun({ id: 'r2', name: 'From Manual', source: 'manual' }),
      ]);
      renderWithClient();
      await screen.findByText('From CI');

      await userEvent.click(screen.getByRole('button', { name: /ci/i }));

      expect(screen.getByText('From CI')).toBeInTheDocument();
      expect(screen.queryByText('From Manual')).not.toBeInTheDocument();
    });
  });

  describe('given New Run is clicked — opens the create form', () => {
    it('creates a run with the entered name and environment', async () => {
      mockRuns([]);
      vi.mocked(testRunsApi.create).mockResolvedValue(
        makeRun({ id: 'new', name: 'New Run' }) as never,
      );
      renderWithClient();
      await screen.findByText('No test runs yet');

      await userEvent.click(screen.getByRole('button', { name: /new run/i }));
      await userEvent.type(await screen.findByLabelText('Name'), 'New Run');
      await userEvent.type(screen.getByLabelText('Environment'), 'staging');
      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() =>
        expect(testRunsApi.create).toHaveBeenCalledWith('proj-1', {
          name: 'New Run',
          environment: 'staging',
          status: 'Active',
        }),
      );
    });
  });

  describe('given Edit is clicked on a run — submits the update', () => {
    it('updates the run with the new name', async () => {
      mockRuns([makeRun({ id: 'r1', name: 'Sprint 42 Regression' })]);
      vi.mocked(testRunsApi.update).mockResolvedValue(
        makeRun({ id: 'r1', name: 'Sprint 42 Regression v2' }) as never,
      );
      renderWithClient();
      await screen.findByText('Sprint 42 Regression');

      await userEvent.click(
        screen.getByRole('button', { name: /edit test run/i }),
      );
      const nameInput = await screen.findByLabelText('Name');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Sprint 42 Regression v2');
      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() =>
        expect(testRunsApi.update).toHaveBeenCalledWith('proj-1', 'r1', {
          name: 'Sprint 42 Regression v2',
          environment: 'staging',
          status: 'Active',
        }),
      );
    });
  });

  describe('given Delete is clicked and confirmed — deletes the run', () => {
    it('calls the delete API for the selected run', async () => {
      mockRuns([makeRun({ id: 'r1', name: 'Sprint 42 Regression' })]);
      vi.mocked(testRunsApi.delete).mockResolvedValue(undefined as never);
      renderWithClient();
      await screen.findByText('Sprint 42 Regression');

      await userEvent.click(
        screen.getByRole('button', { name: /delete test run/i }),
      );
      await userEvent.click(
        await screen.findByRole('button', { name: /^delete$/i }),
      );

      await waitFor(() =>
        expect(testRunsApi.delete).toHaveBeenCalledWith('proj-1', 'r1'),
      );
    });
  });

  describe('given Import is clicked — submits a JUnit import', () => {
    it('imports the uploaded xml file', async () => {
      mockRuns([]);
      vi.mocked(importsApi.junit).mockResolvedValue(makeRun() as never);
      renderWithClient();
      await screen.findByText('No test runs yet');

      await userEvent.click(screen.getByRole('button', { name: /^import$/i }));

      const input = document.querySelector(
        'input#import-files',
      ) as HTMLInputElement;
      const xml = new File(['<testsuite/>'], 'report.xml', {
        type: 'text/xml',
      });
      await userEvent.upload(input, xml);
      await userEvent.type(screen.getByLabelText('Environment'), 'staging');

      const importButtons = screen.getAllByRole('button', {
        name: /^import$/i,
      });
      const submitButton = importButtons.find(
        (button) => button.getAttribute('type') === 'submit',
      );
      await userEvent.click(submitButton!);

      await waitFor(() =>
        expect(importsApi.junit).toHaveBeenCalledWith('proj-1', {
          xml: '<testsuite/>',
          environment: 'staging',
          name: undefined,
        }),
      );
    });
  });
});
