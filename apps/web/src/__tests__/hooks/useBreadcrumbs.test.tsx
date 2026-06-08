import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useBreadcrumbsStore } from "@/stores/breadcrumbs";
import type { BreadcrumbItem } from "@/types";

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

  describe("on unmount — clears the store", () => {
    it("resets breadcrumbs to null", () => {
      const { unmount } = renderHook(() =>
        useBreadcrumbs([{ label: "Projects", href: "/projects" }]),
      );
      unmount();
      expect(useBreadcrumbsStore.getState().items).toBeNull();
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
});
