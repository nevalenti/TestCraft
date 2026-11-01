import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import type { BreadcrumbItem } from "@/stores/breadcrumbs";
import { useBreadcrumbsStore } from "@/stores/breadcrumbs";

afterEach(() => {
  useBreadcrumbsStore.getState().set(null);
});

describe("useBreadcrumbs", () => {
  describe("given items — sets them in the store on mount", () => {
    it("populates the breadcrumbs store", () => {
      renderHook(() =>
        useBreadcrumbs([
          { label: "Dashboard", href: "/" },
          { label: "Projects", href: "/projects" },
        ]),
      );
      const { items } = useBreadcrumbsStore.getState();

      expect(items).toHaveLength(2);
      expect(items![0].label).toBe("Dashboard");
      expect(items![1].label).toBe("Projects");
    });
  });

  describe("when items change — updates the store", () => {
    it("reflects the new items", () => {
      const { rerender } = renderHook(({ items }) => useBreadcrumbs(items), {
        initialProps: {
          items: [{ label: "Projects", href: "/projects" }] as BreadcrumbItem[],
        },
      });

      rerender({ items: [{ label: "Settings" }] });
      const { items } = useBreadcrumbsStore.getState();

      expect(items).toHaveLength(1);
      expect(items![0].label).toBe("Settings");
    });
  });

  describe("given nested pages — the more specific trail wins", () => {
    it("shows the child trail and restores the parent when it leaves", () => {
      const parent = renderHook(() => useBreadcrumbs([{ label: "Project" }]));
      const child = renderHook(() =>
        useBreadcrumbs([{ label: "Project" }, { label: "Note" }], 1),
      );
      parent.rerender();

      expect(useBreadcrumbsStore.getState().items).toHaveLength(2);

      child.unmount();

      expect(useBreadcrumbsStore.getState().items).toEqual([
        { label: "Project" },
      ]);
    });
  });
});
