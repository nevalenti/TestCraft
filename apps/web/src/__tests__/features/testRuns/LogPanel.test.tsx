import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/testRuns/hooks", () => ({ useRunLogs: vi.fn() }));

import { useRunLogs } from "@/features/testRuns/hooks";
import { LogPanel } from "@/features/testRuns/LogPanel";

const logs = (lines: string[], earliestSeq = 1) => ({
  lines,
  earliestSeq,
  hasMore: false,
  isLoadingEarlier: false,
  loadEarlier: vi.fn(),
});

const stubGeometry = (container: HTMLElement, lineCount: () => number) => {
  Object.defineProperties(container, {
    clientHeight: { value: 100 },
    scrollHeight: {
      get: () => lineCount() * 20,
    },
  });
};

const setup = () => {
  let current = logs(Array.from({ length: 10 }, (_, i) => `line ${i}`));
  vi.mocked(useRunLogs).mockImplementation(() => current);
  const view = render(<LogPanel projectId="p1" runId="r1" />);
  const container = screen.getByText(/line 0/).parentElement!;
  stubGeometry(container, () => current.lines.length);
  const update = (next: ReturnType<typeof logs>) => {
    current = next;
    view.rerender(<LogPanel projectId="p1" runId="r1" />);
  };
  return { container, update, lines: () => current.lines };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LogPanel scrolling", () => {
  it("follows new output while the reader is at the bottom", () => {
    const { container, update, lines } = setup();
    container.scrollTop = 100;
    fireEvent.scroll(container);

    update(logs([...lines(), "line 10", "line 11"]));

    expect(container.scrollTop).toBe(240);
  });

  it("leaves the position alone while the reader is scrolled up", () => {
    const { container, update, lines } = setup();
    container.scrollTop = 20;
    fireEvent.scroll(container);

    update(logs([...lines(), "line 10", "line 11"]));

    expect(container.scrollTop).toBe(20);
  });

  it("keeps the visible lines in place when earlier lines are prepended", () => {
    const { container, update, lines } = setup();
    update(logs([...lines()]));
    container.scrollTop = 20;
    fireEvent.scroll(container);

    update(logs(["early 1", "early 2", ...lines()], 0));

    expect(container.scrollTop).toBe(60);
  });
});
