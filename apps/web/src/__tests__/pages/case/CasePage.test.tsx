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

vi.mock("@/features/projects/hooks", () => ({
  useProject: vi.fn(),
}));

vi.mock("@/features/testSuites/hooks", () => ({
  useTestSuite: vi.fn(),
}));

vi.mock("@/features/testCases/hooks", () => ({
  useTestCase: vi.fn(),
  useUpdateTestCase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock("@tanstack/react-router", () => ({
  getRouteApi: () => ({
    useParams: () => ({
      projectId: "projectId-1",
      suiteId: "suiteId-1",
      caseId: "caseId-1",
    }),
  }),
  Link: ({ children, to }: { children?: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/features/testCaseSteps/hooks", () => ({
  useTestCaseSteps: vi.fn(),
  useCreateTestCaseStep: vi.fn(),
  useUpdateTestCaseStep: vi.fn(),
  useReorderTestCaseSteps: vi.fn(),
  useDeleteTestCaseStep: vi.fn(),
}));

vi.mock("@/hooks/useBreadcrumbs", () => ({ useBreadcrumbs: vi.fn() }));

import type { TestCaseStep } from "@testcraft/types";

import { createWrapper } from "@/__tests__/test-utils";
import { useProject } from "@/features/projects/hooks";
import { useTestCase } from "@/features/testCases/hooks";
import {
  useCreateTestCaseStep,
  useDeleteTestCaseStep,
  useReorderTestCaseSteps,
  useTestCaseSteps,
  useUpdateTestCaseStep,
} from "@/features/testCaseSteps/hooks";
import { useTestSuite } from "@/features/testSuites/hooks";
import { CasePage } from "@/pages/case/CasePage";

const makeStep = (overrides: Partial<TestCaseStep> = {}): TestCaseStep => ({
  id: "step-1",
  version: 1,
  test_case_id: "caseId-1",
  order: 1,
  action: "Click login",
  expected_result: "User is redirected to the dashboard",
  created_at: "2026-01-15T00:00:00.000Z",
  updated_at: "2026-01-15T00:00:00.000Z",
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
    data: { id: "proj-1", name: "My Project" },
    isPending: false,
  } as unknown as ReturnType<typeof useProject>);

  vi.mocked(useTestSuite).mockReturnValue({
    data: { id: "suite-1", name: "Auth" },
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
  vi.mocked(useReorderTestCaseSteps).mockReturnValue({
    mutate: bulkReorderMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useReorderTestCaseSteps>);
  vi.mocked(useDeleteTestCaseStep).mockReturnValue({
    mutate: deleteStepMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteTestCaseStep>);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CasePage", () => {
  describe("loading state — shows skeleton", () => {
    it("renders a loading status region when isPending", async () => {
      setupMocks({ steps: undefined, isPending: true });
      render(<CasePage />);
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Loading steps",
      );
    });
  });

  describe("error state — shows an error instead of the empty state", () => {
    it("renders the failure message when the steps query errors", () => {
      setupMocks({ steps: undefined, isError: true });
      render(<CasePage />);
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
      expect(screen.queryByText("No steps defined")).not.toBeInTheDocument();
    });
  });

  describe("empty state — prompts to add steps", () => {
    it("shows the no-steps message", () => {
      setupMocks({ steps: [] });
      render(<CasePage />);
      expect(screen.getByText("No steps defined")).toBeInTheDocument();
    });
  });

  describe("with steps — renders each one", () => {
    it("displays the action and expected result for every step", () => {
      setupMocks({
        steps: [
          makeStep({ id: "step-1", action: "Click login" }),
          makeStep({
            id: "step-2",
            order: 2,
            action: "Enter password",
            expected_result: "Password field accepts input",
          }),
        ],
      });
      render(<CasePage />);
      expect(screen.getByText("Click login")).toBeInTheDocument();
      expect(screen.getByText("Enter password")).toBeInTheDocument();
      expect(
        screen.getByText("Password field accepts input"),
      ).toBeInTheDocument();
    });
  });

  describe("Add Step button — opens the create modal", () => {
    it("shows the Add Step modal heading on click", async () => {
      setupMocks({ steps: [makeStep()] });
      render(<CasePage />);
      await userEvent.click(
        screen.getAllByRole("button", { name: /Add Step/i })[0],
      );
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "Add Step" }),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("edit action — opens the edit modal", () => {
    it("shows the Edit Step modal heading on click", async () => {
      setupMocks({ steps: [makeStep()] });
      render(<CasePage />);
      await userEvent.click(screen.getByRole("button", { name: "Edit step" }));
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "Edit Step" }),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("delete action — opens the confirm dialog and calls delete", () => {
    it("calls deleteStep.mutate with the step id on confirm", async () => {
      setupMocks({ steps: [makeStep({ id: "step-1" })] });
      render(<CasePage />);
      await userEvent.click(
        screen.getByRole("button", { name: "Delete step" }),
      );
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "Delete Step" }),
        ).toBeInTheDocument(),
      );
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));
      expect(deleteStepMutate).toHaveBeenCalledWith(
        "step-1",
        expect.anything(),
      );
    });
  });
});

describe("CasePage header", () => {
  it("shows the case name and priority and opens the edit form", async () => {
    setupMocks({ steps: [makeStep()] });
    vi.mocked(useTestCase).mockReturnValue({
      data: {
        id: "case-1",
        suite_id: "suite-1",
        name: "Login works",
        description: "Happy path sign in",
        priority: "high",
        step_count: 1,
        labels: [],
        created_at: "2026-01-15T00:00:00.000Z",
        updated_at: "2026-01-15T00:00:00.000Z",
      },
      isPending: false,
    } as unknown as ReturnType<typeof useTestCase>);

    render(<CasePage />, { wrapper: createWrapper().wrapper });

    expect(
      screen.getByRole("heading", { name: "Login works", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Happy path sign in")).toBeInTheDocument();
    expect(screen.getByText("1 step")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Edit Test Case")).toBeInTheDocument();
  });
});
