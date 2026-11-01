import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("@/features/testPlans/hooks", () => ({
  useTestPlansPage: vi.fn(),
  useCreateTestPlan: vi.fn(),
  useUpdateTestPlan: vi.fn(),
  useDeleteTestPlan: vi.fn(),
}));

import type { TestPlan } from "@testcraft/types";

import {
  useCreateTestPlan,
  useDeleteTestPlan,
  useTestPlansPage,
  useUpdateTestPlan,
} from "@/features/testPlans/hooks";
import { PlansTab } from "@/pages/project/PlansTab";

const makePlan = (overrides: Partial<TestPlan> = {}): TestPlan => ({
  id: "plan-1",
  version: 1,
  project_id: "proj-1",
  name: "Sprint 1",
  case_count: 0,
  created_at: "2026-01-15T00:00:00.000Z",
  ...overrides,
});

const noopMutation = { mutate: vi.fn(), isPending: false };

const setupMocks = (plans: TestPlan[] | undefined = [], isPending = false) => {
  vi.mocked(useTestPlansPage).mockImplementation(
    (_projectId, _page, search) =>
      ({
        data: plans && {
          items: plans.filter((plan) =>
            plan.name.toLowerCase().includes(search.toLowerCase()),
          ),
          total: plans.length,
          page: 1,
          page_size: 20,
        },
        isPending,
      }) as unknown as ReturnType<typeof useTestPlansPage>,
  );

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

describe("PlansTab", () => {
  describe("loading state — shows skeleton", () => {
    it("renders a loading status region when isPending", async () => {
      setupMocks(undefined, true);
      render(<PlansTab />);
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Loading test plans",
      );
    });
  });

  describe("empty state — shows no plans message", () => {
    it("renders the empty state title", () => {
      setupMocks([]);
      render(<PlansTab />);
      expect(screen.getByText("No test plans yet")).toBeInTheDocument();
    });
  });

  describe("with plans — renders each plan", () => {
    it("displays plan names", () => {
      setupMocks([
        makePlan({ name: "Sprint 1" }),
        makePlan({ id: "plan-2", name: "Regression" }),
      ]);
      render(<PlansTab />);
      expect(screen.getByText("Sprint 1")).toBeInTheDocument();
      expect(screen.getByText("Regression")).toBeInTheDocument();
    });

    it("shows plan description when present", () => {
      setupMocks([makePlan({ description: "Core login flows" })]);
      render(<PlansTab />);
      expect(screen.getByText("Core login flows")).toBeInTheDocument();
    });

    it("shows case count in plan metadata", () => {
      setupMocks([makePlan({ case_count: 5 })]);
      render(<PlansTab />);
      expect(screen.getByText(/5 cases/)).toBeInTheDocument();
    });
  });

  it("requests the next server page when more plans are available", async () => {
    setupMocks([makePlan()]);
    vi.mocked(useTestPlansPage).mockImplementation(
      (_projectId, page) =>
        ({
          data: {
            items: [makePlan()],
            total: 21,
            page,
            page_size: 20,
          },
          isPending: false,
        }) as unknown as ReturnType<typeof useTestPlansPage>,
    );
    render(<PlansTab />);

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(useTestPlansPage).toHaveBeenCalledWith(
      "proj-1",
      2,
      "",
      "created_at",
      "desc",
    );
  });

  describe("New Test Plan button — is rendered", () => {
    it("shows the New Test Plan button", () => {
      setupMocks([]);
      render(<PlansTab />);
      expect(
        screen.getAllByRole("button", { name: /New Test Plan/i })[0],
      ).toBeInTheDocument();
    });
  });

  describe("New Test Plan button — opens the create modal", () => {
    it("shows the New Test Plan modal heading on click", async () => {
      setupMocks([makePlan()]);
      render(<PlansTab />);
      await userEvent.click(
        screen.getAllByRole("button", { name: /New Test Plan/i })[0],
      );
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "New Test Plan" }),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("edit button — opens the edit modal", () => {
    it("shows the Edit Test Plan modal heading on click", async () => {
      setupMocks([makePlan({ name: "Sprint 1" })]);
      render(<PlansTab />);
      await userEvent.click(screen.getByRole("button", { name: "Edit plan" }));
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "Edit Test Plan" }),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("given a search term — queries filtered plans", () => {
    it("passes the typed name to the page query", async () => {
      setupMocks([
        makePlan({ id: "plan-1", name: "Sprint 1" }),
        makePlan({ id: "plan-2", name: "Regression" }),
      ]);
      render(<PlansTab />);
      await userEvent.type(
        screen.getByPlaceholderText("Search test plans…"),
        "Sprint",
      );

      await waitFor(() =>
        expect(useTestPlansPage).toHaveBeenCalledWith(
          "proj-1",
          1,
          "Sprint",
          "created_at",
          "desc",
        ),
      );
      expect(screen.queryByText("Regression")).not.toBeInTheDocument();
      expect(screen.getByText("Sprint 1")).toBeInTheDocument();
    });
  });

  describe("given Delete is clicked and confirmed — deletes the plan", () => {
    it("calls the delete mutation with the selected plan id", async () => {
      setupMocks([makePlan({ id: "plan-1", name: "Sprint 1" })]);
      render(<PlansTab />);

      await userEvent.click(
        screen.getByRole("button", { name: "Delete plan" }),
      );
      await userEvent.click(
        await screen.findByRole("button", { name: /^delete$/i }),
      );

      expect(noopMutation.mutate).toHaveBeenCalledWith(
        "plan-1",
        expect.anything(),
      );
    });
  });
});
