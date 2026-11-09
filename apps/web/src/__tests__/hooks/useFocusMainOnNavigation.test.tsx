import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const subscribe = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ subscribe }),
}));

import { useFocusMainOnNavigation } from "@/hooks/useFocusMainOnNavigation";

describe("useFocusMainOnNavigation", () => {
  it("focuses main when the path changes and ignores same-path resolves", () => {
    let onResolved: (event: { pathChanged: boolean }) => void = () => {};
    subscribe.mockImplementation((_, callback) => {
      onResolved = callback;
      return vi.fn();
    });
    const main = document.createElement("main");
    main.tabIndex = -1;
    document.body.append(main);
    renderHook(() => useFocusMainOnNavigation({ current: main }));

    onResolved({ pathChanged: false });
    expect(main).not.toHaveFocus();

    onResolved({ pathChanged: true });
    expect(main).toHaveFocus();
  });
});
