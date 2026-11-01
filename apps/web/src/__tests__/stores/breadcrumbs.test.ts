import { beforeEach, describe, expect, it } from "vitest";

import { useBreadcrumbsStore } from "@/stores/breadcrumbs";

beforeEach(() => {
  useBreadcrumbsStore.getState().set(null);
});

describe("useBreadcrumbsStore", () => {
  describe("initial state — items list is null", () => {
    it("starts with no breadcrumbs", () => {
      expect(useBreadcrumbsStore.getState().items).toBeNull();
    });
  });

  describe("set — replaces the current items", () => {
    it("stores the provided breadcrumbs", () => {
      useBreadcrumbsStore
        .getState()
        .set([{ label: "Projects", href: "/projects" }, { label: "Alpha" }]);

      const { items } = useBreadcrumbsStore.getState();

      expect(items).toHaveLength(2);
      expect(items![0].label).toBe("Projects");
      expect(items![0].href).toBe("/projects");
      expect(items![1].label).toBe("Alpha");
      expect(items![1].href).toBeUndefined();
    });

    it("replaces a previous set of breadcrumbs", () => {
      useBreadcrumbsStore.getState().set([{ label: "Old", href: "/old" }]);
      useBreadcrumbsStore.getState().set([{ label: "New", href: "/new" }]);

      const { items } = useBreadcrumbsStore.getState();

      expect(items).toHaveLength(1);
      expect(items![0].label).toBe("New");
    });

    it("can clear breadcrumbs by setting an empty array", () => {
      useBreadcrumbsStore
        .getState()
        .set([{ label: "Projects", href: "/projects" }]);
      useBreadcrumbsStore.getState().set([]);

      expect(useBreadcrumbsStore.getState().items).toHaveLength(0);
    });
  });
});
