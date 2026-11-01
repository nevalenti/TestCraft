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
  getRouteApi: () => ({
    useParams: () => ({ projectId: "projectId-1", planId: "planId-1" }),
  }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  Link: ({ children, to }: { children?: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/features/projects/hooks", () => ({
  useProject: vi.fn(),
}));

vi.mock("@/features/testCases/hooks", () => ({
  useProjectTestCases: vi.fn(),
}));

vi.mock("@/features/testPlans/hooks", () => ({
  useTestPlan: vi.fn(),
  useTestPlanCases: vi.fn(),
  useAddCaseToPlan: vi.fn(),
  useRemoveCaseFromPlan: vi.fn(),
  useReorderPlanCases: vi.fn(),
  useCreateRunFromPlan: vi.fn(),
}));

vi.mock("@/hooks/useBreadcrumbs", () => ({ useBreadcrumbs: vi.fn() }));

import type { TestPlan, TestPlanCase } from "@testcraft/types";

import { useProject } from "@/features/projects/hooks";
import { useProjectTestCases } from "@/features/testCases/hooks";
import {
  useAddCaseToPlan,
  useCreateRunFromPlan,
  useRemoveCaseFromPlan,
  useReorderPlanCases,
  useTestPlan,
  useTestPlanCases,
} from "@/features/testPlans/hooks";
import { PlanPage } from "@/pages/plan/PlanPage";

const makePlan = (overrides: Partial<TestPlan> = {}): TestPlan => ({
  id: "plan-1",
  version: 1,
  project_id: "proj-1",
  name: "Sprint 1",
  case_count: 0,
  created_at: "2026-01-15T00:00:00.000Z",
  ...overrides,
});

const makeCase = (overrides: Partial<TestPlanCase> = {}): TestPlanCase => ({
  test_case_id: "case-1",
  test_case_name: "Login works",
  suite_name: "Auth",
  order: 1,
  ...overrides,
});

const addCaseMutate = vi.fn();
const removeCaseMutate = vi.fn();
const reorderCasesMutate = vi.fn();
const createRunMutate = vi.fn();

const setupMocks = ({
  cases = [] as TestPlanCase[] | undefined,
  isPending = false,
  isError = false,
  error = undefined as unknown,
} = {}) => {
  vi.mocked(useProject).mockReturnValue({
    data: { id: "proj-1", name: "My Project" },
    isPending: false,
  } as unknown as ReturnType<typeof useProject>);

  vi.mocked(useTestPlan).mockReturnValue({
    data: makePlan(),
    isPending: false,
  } as unknown as ReturnType<typeof useTestPlan>);

  vi.mocked(useTestPlanCases).mockReturnValue({
    data: cases,
    isPending,
    isError,
    error,
  } as unknown as ReturnType<typeof useTestPlanCases>);

  vi.mocked(useProjectTestCases).mockReturnValue({
    data: [],
    isPending: false,
  } as unknown as ReturnType<typeof useProjectTestCases>);

  vi.mocked(useAddCaseToPlan).mockReturnValue({
    mutate: addCaseMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useAddCaseToPlan>);
  vi.mocked(useRemoveCaseFromPlan).mockReturnValue({
    mutate: removeCaseMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useRemoveCaseFromPlan>);
  vi.mocked(useReorderPlanCases).mockReturnValue({
    mutate: reorderCasesMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useReorderPlanCases>);
  vi.mocked(useCreateRunFromPlan).mockReturnValue({
    mutate: createRunMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateRunFromPlan>);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PlanPage", () => {
  describe("loading state — shows skeleton", () => {
    it("renders a loading status region when isPending", async () => {
      setupMocks({ cases: undefined, isPending: true });
      render(<PlanPage />);
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Loading plan cases",
      );
    });
  });

  describe("error state — shows an error instead of the empty state", () => {
    it("renders the failure message when the cases query errors", () => {
      setupMocks({ cases: undefined, isError: true });
      render(<PlanPage />);
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
      expect(
        screen.queryByText("Add test cases from the right panel."),
      ).not.toBeInTheDocument();
    });
  });

  describe("empty state — prompts to add cases", () => {
    it("shows the empty-plan hint", () => {
      setupMocks({ cases: [] });
      render(<PlanPage />);
      expect(
        screen.getByText("Add test cases from the right panel."),
      ).toBeInTheDocument();
    });

    it("disables the Run Plan button", () => {
      setupMocks({ cases: [] });
      render(<PlanPage />);
      expect(screen.getByRole("button", { name: /Run Plan/i })).toBeDisabled();
    });
  });

  describe("with cases — renders each one", () => {
    it("displays case names and the plan case count", () => {
      setupMocks({
        cases: [
          makeCase({ test_case_id: "case-1", test_case_name: "Login works" }),
          makeCase({
            test_case_id: "case-2",
            test_case_name: "Logout works",
            order: 2,
          }),
        ],
      });
      render(<PlanPage />);
      expect(screen.getByText("Login works")).toBeInTheDocument();
      expect(screen.getByText("Logout works")).toBeInTheDocument();
      expect(screen.getByText("Plan Cases (2)")).toBeInTheDocument();
    });

    it("enables the Run Plan button", () => {
      setupMocks({ cases: [makeCase()] });
      render(<PlanPage />);
      expect(
        screen.getByRole("button", { name: /Run Plan/i }),
      ).not.toBeDisabled();
    });
  });

  describe("remove button — removes the case from the plan", () => {
    it("calls removeCase.mutate with the test case id", async () => {
      setupMocks({ cases: [makeCase({ test_case_id: "case-1" })] });
      render(<PlanPage />);
      await userEvent.click(
        screen.getByRole("button", { name: "Remove from plan" }),
      );
      expect(removeCaseMutate).toHaveBeenCalledWith("case-1");
    });
  });

  describe("Run Plan button — opens the run modal", () => {
    it("shows the Run Test Plan modal heading on click", async () => {
      setupMocks({ cases: [makeCase()] });
      render(<PlanPage />);
      await userEvent.click(screen.getByRole("button", { name: /Run Plan/i }));
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "Run Test Plan" }),
        ).toBeInTheDocument(),
      );
    });
  });
});
