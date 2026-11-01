import { TestResultStatus, TestRunStatus } from "@testcraft/types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useBreadcrumbs", () => ({ useBreadcrumbs: vi.fn() }));
const searchStore = vi.hoisted(() => {
  let current: Record<string, unknown> = {};
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (next: Record<string, unknown>) => {
      current = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const { useSyncExternalStore } = await import("react");
  type Search = Record<string, unknown>;
  const navigate = ({
    search,
  }: {
    search: Search | ((previous: Search) => Search);
  }) =>
    searchStore.set(
      typeof search === "function" ? search(searchStore.get()) : search,
    );

  return {
    ...(await importOriginal<object>()),
    getRouteApi: () => ({
      useParams: () => ({ projectId: "projectId-1", runId: "runId-1" }),
    }),
    Link: ({ children, to }: { children?: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
    useSearch: () =>
      useSyncExternalStore(searchStore.subscribe, searchStore.get),
    useNavigate: () => navigate,
  };
});
vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: <T,>(value: T) => value,
}));
vi.mock("@/features/projects/hooks", () => ({
  useProject: vi.fn(() => ({ data: { name: "Project" } })),
}));
vi.mock("@/features/projects/permissions", () => ({
  useProjectPermissions: vi.fn(() => ({ canEdit: false })),
}));
vi.mock("@/features/testRuns/hooks", () => ({
  useUpdateTestRun: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useTestRun: vi.fn(() => ({ data: { name: "Run" } })),
  useTestRunSummary: vi.fn(() => ({
    data: { total: 40 },
    isPending: false,
    isError: false,
  })),
}));
vi.mock("@/features/testRuns/useTestRunRealtime", () => ({
  useTestRunRealtime: vi.fn(),
}));
vi.mock("@/api/sdk", () => ({
  listTestResults: vi.fn().mockResolvedValue({
    data: { items: [], total: 40, page: 1, page_size: 15 },
  }),
}));
vi.mock("@/features/testResults/RunSummaryBar", () => ({
  RunSummaryBar: ({
    onStatusFilter,
    onSearch,
  }: {
    onStatusFilter: (status: TestResultStatus | null) => void;
    onSearch: (search: string) => void;
  }) => (
    <>
      <button onClick={() => onStatusFilter(TestResultStatus.Failed)}>
        Failed only
      </button>
      <input aria-label="Search" onChange={(e) => onSearch(e.target.value)} />
    </>
  ),
}));
vi.mock("@/features/testResults/ResultsContent", () => ({
  ResultsContent: ({
    table,
  }: {
    table: { setPageIndex: (index: number) => void };
  }) => <button onClick={() => table.setPageIndex(1)}>Page 2</button>,
}));
vi.mock("@/features/testResults/ResultModals", () => ({
  ResultModals: () => null,
}));
vi.mock("@/features/shareTokens/ShareModal", () => ({
  ShareModal: () => null,
}));
vi.mock("@/features/attachments/AttachmentModal", () => ({
  AttachmentModal: () => null,
}));

import { createWrapper } from "@/__tests__/test-utils";
import * as sdk from "@/api/sdk";
import { useProjectPermissions } from "@/features/projects/permissions";
import { useTestRun, useUpdateTestRun } from "@/features/testRuns/hooks";
import { RunPage } from "@/pages/run/RunPage";
import type { RunPageSearch } from "@/pages/run/runPageSearch";
import { Route } from "@/routes/_app.projects.$projectId_.runs.$runId";

const requestedPages = () =>
  vi.mocked(sdk.listTestResults).mock.calls.map(([options]) => {
    const { status, search, page } = options.query ?? {};
    return { status, search, page };
  });

const renderPage = async () => {
  render(<RunPage />, { wrapper: createWrapper().wrapper });
  await userEvent.click(await screen.findByRole("button", { name: "Page 2" }));
  await waitFor(() =>
    expect(requestedPages().at(-1)).toMatchObject({ page: 2 }),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  searchStore.set({});
});

describe("RunPage pagination", () => {
  it("never requests the old page with a new status filter", async () => {
    await renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Failed only" }));
    await waitFor(() =>
      expect(requestedPages().at(-1)).toMatchObject({ page: 1 }),
    );

    expect(requestedPages()).not.toContainEqual(
      expect.objectContaining({ status: TestResultStatus.Failed, page: 2 }),
    );
    expect(requestedPages().at(-1)).toMatchObject({
      status: TestResultStatus.Failed,
      page: 1,
    });
  });

  it("never requests the old page with a new search", async () => {
    await renderPage();

    await userEvent.type(screen.getByLabelText("Search"), "x");
    await waitFor(() =>
      expect(requestedPages().at(-1)).toMatchObject({ page: 1 }),
    );

    expect(requestedPages()).not.toContainEqual(
      expect.objectContaining({ search: "x", page: 2 }),
    );
    expect(requestedPages().at(-1)).toMatchObject({ search: "x", page: 1 });
  });
});

describe("RunPage header", () => {
  it("completes an active run from the header", async () => {
    const mutate = vi.fn();
    vi.mocked(useProjectPermissions).mockReturnValue({
      canEdit: true,
    } as ReturnType<typeof useProjectPermissions>);
    vi.mocked(useTestRun).mockReturnValue({
      data: {
        id: "run-1",
        name: "Nightly",
        environment: "staging",
        status: TestRunStatus.Active,
        created_at: new Date().toISOString(),
      },
    } as ReturnType<typeof useTestRun>);
    vi.mocked(useUpdateTestRun).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateTestRun>);

    render(<RunPage />, { wrapper: createWrapper().wrapper });

    expect(
      screen.getByRole("heading", { name: "Nightly", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("staging")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Complete run" }));

    expect(mutate).toHaveBeenCalledWith({
      id: "run-1",
      name: "Nightly",
      environment: "staging",
      status: TestRunStatus.Completed,
    });
  });
});

describe("RunPage URL state", () => {
  it("keeps the status filter in the URL", async () => {
    render(<RunPage />, { wrapper: createWrapper().wrapper });

    await userEvent.click(
      await screen.findByRole("button", { name: "Failed only" }),
    );

    expect(searchStore.get()).toMatchObject({
      status: TestResultStatus.Failed,
    });
  });

  it("syncs the search to the URL without updating state during render", async () => {
    const consoleError = vi.spyOn(console, "error");
    render(<RunPage />, { wrapper: createWrapper().wrapper });

    await userEvent.type(await screen.findByLabelText("Search"), "x");

    await waitFor(() => expect(searchStore.get()).toMatchObject({ q: "x" }));
    expect(
      consoleError.mock.calls
        .flat()
        .some((argument) => String(argument).includes("while rendering")),
    ).toBe(false);
    consoleError.mockRestore();
  });

  it("reads the results the route loader prefetched", async () => {
    const search = { status: TestResultStatus.Blocked, q: "login" };
    searchStore.set(search);
    const { queryClient, wrapper } = createWrapper();
    queryClient.setDefaultOptions({
      queries: { retry: false, staleTime: 60_000 },
    });
    const { loader, loaderDeps } = Route.options as unknown as {
      loaderDeps: (options: { search: RunPageSearch }) => RunPageSearch;
      loader: (context: unknown) => Promise<unknown>;
    };
    await loader({
      context: {
        queryClient: {
          ensureQueryData: (options: { queryKey: unknown[] }) =>
            options.queryKey.includes("results")
              ? queryClient.ensureQueryData(options as never)
              : Promise.resolve(),
        },
      },
      params: { projectId: "projectId-1", runId: "runId-1" },
      deps: loaderDeps({ search }),
    });

    render(<RunPage />, { wrapper });
    await screen.findByRole("button", { name: "Page 2" });

    expect(sdk.listTestResults).toHaveBeenCalledOnce();
  });

  it("restores the status filter and search from the URL", async () => {
    searchStore.set({ status: TestResultStatus.Blocked, q: "login" });
    render(<RunPage />, { wrapper: createWrapper().wrapper });

    await waitFor(() =>
      expect(requestedPages().at(-1)).toMatchObject({
        status: TestResultStatus.Blocked,
        search: "login",
      }),
    );
  });
});
