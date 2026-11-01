import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

vi.mock("@/features/projects/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/projects/permissions")>()),
  useProjectPermissions: vi.fn().mockReturnValue({
    role: "owner",
    canEdit: true,
    canManage: true,
    isOwner: true,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  getRouteApi: () => ({ useParams: () => ({ projectId: "proj-1" }) }),
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

vi.mock("@/features/testSuites/api", () => ({
  testSuiteQueries: {
    all: vi.fn((projectId: string, search?: string) => ({
      queryKey: ["projects", projectId, "suites", search],
      queryFn: vi.fn().mockResolvedValue({ items: [] }),
    })),
    detail: vi.fn(() => ({
      queryKey: ["unused"],
      queryFn: vi.fn().mockResolvedValue(null),
    })),
  },
  testSuitesApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));

import { useProjectPermissions } from "@/features/projects/permissions";
import { testSuiteQueries, testSuitesApi } from "@/features/testSuites/api";
import { SuitesTab } from "@/pages/project/SuitesTab";

const makeSuite = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "s1",
  version: 4,
  name: "Login Flow",
  description: "Covers login",
  source: null,
  created_at: "2026-01-10T00:00:00Z",
  ...overrides,
});

const renderWithClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<SuitesTab />, { wrapper });
};

const mockSuites = (items: ReturnType<typeof makeSuite>[]) => {
  vi.mocked(testSuiteQueries.all).mockImplementation(
    (projectId: string, search?: string) =>
      ({
        queryKey: ["projects", projectId, "suites", search],
        queryFn: vi.fn().mockResolvedValue({ items }),
      }) as never,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSuites([]);
});

describe("SuitesTab", () => {
  describe("given no suites — shows the empty state", () => {
    it("renders the empty-state copy", async () => {
      renderWithClient();
      expect(await screen.findByText("No test suites yet")).toBeInTheDocument();
    });
  });

  describe("given suites — renders a table row per suite", () => {
    it("shows each suite name", async () => {
      mockSuites([
        makeSuite({ id: "s1", name: "Login Flow" }),
        makeSuite({ id: "s2", name: "Checkout" }),
      ]);
      renderWithClient();

      expect(await screen.findByText("Login Flow")).toBeInTheDocument();
      expect(screen.getByText("Checkout")).toBeInTheDocument();
      expect(screen.getAllByTestId("suite-card")).toHaveLength(2);
    });
  });

  describe("given a search term — debounces before refetching", () => {
    it("calls testSuiteQueries.all with the typed search after the debounce delay", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mockSuites([]);
      renderWithClient();

      const input = screen.getByPlaceholderText("Search test suites…");
      await userEvent.type(input, "auth", { delay: null });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      await waitFor(() =>
        expect(testSuiteQueries.all).toHaveBeenCalledWith("proj-1", "auth"),
      );
      vi.useRealTimers();
    });
  });

  describe("given source-tagged suites — filters by the selected source chip", () => {
    it("shows only suites matching the selected source", async () => {
      mockSuites([
        makeSuite({ id: "s1", name: "From Jira", source: "jira" }),
        makeSuite({ id: "s2", name: "From TestRail", source: "testrail" }),
      ]);
      renderWithClient();
      await screen.findByText("From Jira");

      await userEvent.click(screen.getByRole("button", { name: /jira/i }));

      expect(screen.getByText("From Jira")).toBeInTheDocument();
      expect(screen.queryByText("From TestRail")).not.toBeInTheDocument();
    });
  });

  describe("given New Suite is clicked — opens the create form", () => {
    it("creates a suite with the entered name", async () => {
      mockSuites([]);
      vi.mocked(testSuitesApi.create).mockResolvedValue(
        makeSuite({ id: "new", name: "New Suite" }) as never,
      );
      renderWithClient();
      await screen.findByText("No test suites yet");

      await userEvent.click(
        screen.getByRole("button", { name: /new test suite/i }),
      );
      await userEvent.type(await screen.findByLabelText("Name"), "New Suite");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() =>
        expect(testSuitesApi.create).toHaveBeenCalledWith("proj-1", {
          name: "New Suite",
          description: undefined,
        }),
      );
    });
  });

  describe("given Edit is clicked on a suite — submits the update", () => {
    it("updates the suite with the new name", async () => {
      mockSuites([makeSuite({ id: "s1", name: "Login Flow" })]);
      vi.mocked(testSuitesApi.update).mockResolvedValue(
        makeSuite({ id: "s1", name: "Login Flow v2" }) as never,
      );
      renderWithClient();
      await screen.findByText("Login Flow");

      await userEvent.click(
        screen.getByRole("button", { name: /edit test suite/i }),
      );
      const nameInput = await screen.findByLabelText("Name");
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, "Login Flow v2");
      await userEvent.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() =>
        expect(testSuitesApi.update).toHaveBeenCalledWith(
          "proj-1",
          "s1",
          {
            name: "Login Flow v2",
            description: "Covers login",
          },
          4,
        ),
      );
    });
  });

  describe("given Delete is clicked and confirmed — deletes the suite", () => {
    it("calls the delete API for the selected suite", async () => {
      mockSuites([makeSuite({ id: "s1", name: "Login Flow" })]);
      vi.mocked(testSuitesApi.delete).mockResolvedValue(undefined as never);
      renderWithClient();
      await screen.findByText("Login Flow");

      await userEvent.click(
        screen.getByRole("button", { name: /delete test suite/i }),
      );
      await userEvent.click(
        await screen.findByRole("button", { name: /^delete$/i }),
      );

      await waitFor(() =>
        expect(testSuitesApi.delete).toHaveBeenCalledWith("proj-1", "s1"),
      );
    });
  });

  describe("given a viewer — shows suites read-only", () => {
    it("hides creating, editing and deleting", async () => {
      vi.mocked(useProjectPermissions).mockReturnValue({
        role: "viewer",
        canEdit: false,
        canManage: false,
        isOwner: false,
      });
      mockSuites([makeSuite({ id: "s1", name: "Login Flow" })]);
      renderWithClient();

      expect(await screen.findByText("Login Flow")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /new test suite/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /edit/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /delete/i }),
      ).not.toBeInTheDocument();
    });
  });
});
