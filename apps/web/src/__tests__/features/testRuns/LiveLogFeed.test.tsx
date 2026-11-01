import { render, screen } from "@testing-library/react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("@/features/testRuns/hooks", () => ({ useTestRun: vi.fn() }));
vi.mock("@/features/testRuns/useResultFeed", () => ({
  useResultFeed: vi.fn(),
}));

import { useTestRun } from "@/features/testRuns/hooks";
import { LiveLogFeed } from "@/features/testRuns/LiveLogFeed";
import { useResultFeed } from "@/features/testRuns/useResultFeed";

const result = (index: number) => ({
  id: `res-${index}`,
  test_case_name: `Case ${index}`,
  status: "passed",
  duration_ms: 1200,
  created_at: "2026-10-18T10:00:00Z",
});

const givenFeed = (
  runStatus: "active" | "completed",
  items: ReturnType<typeof result>[],
  isLoading = false,
) => {
  vi.mocked(useTestRun).mockReturnValue({
    data: { status: runStatus },
  } as ReturnType<typeof useTestRun>);
  vi.mocked(useResultFeed).mockReturnValue({
    items,
    isLoading,
  } as ReturnType<typeof useResultFeed>);
};

const elementSize = {
  offsetHeight: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetHeight",
  ),
  offsetWidth: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetWidth",
  ),
};

beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { configurable: true, get: () => 490 },
    offsetWidth: { configurable: true, get: () => 800 },
  });
});

afterAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: elementSize.offsetHeight!,
    offsetWidth: elementSize.offsetWidth!,
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LiveLogFeed", () => {
  it("shows a live badge and a waiting state before an active run reports results", () => {
    givenFeed("active", []);
    render(<LiveLogFeed projectId="p1" runId="r1" />);

    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("0 results")).toBeInTheDocument();
    expect(screen.getByText("Waiting for results")).toBeInTheDocument();
  });

  it("lists the results of a completed run", () => {
    givenFeed("completed", [result(1), result(2)]);
    render(<LiveLogFeed projectId="p1" runId="r1" />);

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("2 results")).toBeInTheDocument();
    expect(screen.getByText("Case 1")).toBeInTheDocument();
    expect(screen.getByText("Case 2")).toBeInTheDocument();
    expect(screen.queryByText("Waiting for results")).not.toBeInTheDocument();
  });

  it("renders only the visible window of a long feed", () => {
    givenFeed(
      "active",
      Array.from({ length: 500 }, (_, index) => result(index)),
    );
    render(<LiveLogFeed projectId="p1" runId="r1" />);

    expect(screen.getByText("500 results")).toBeInTheDocument();
    expect(screen.getByText("Case 0")).toBeInTheDocument();
    expect(screen.queryByText("Case 499")).not.toBeInTheDocument();
    expect(screen.getAllByText(/^Case \d+$/).length).toBeLessThan(50);
  });

  it("renders no feed while the first page is loading", () => {
    givenFeed("active", [], true);
    render(<LiveLogFeed projectId="p1" runId="r1" />);

    expect(screen.queryByText("Live")).not.toBeInTheDocument();
    expect(screen.queryByText("Waiting for results")).not.toBeInTheDocument();
  });
});
