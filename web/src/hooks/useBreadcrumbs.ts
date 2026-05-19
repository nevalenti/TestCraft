import { useEffect } from "react";

import { type BreadcrumbItem, useBreadcrumbsStore } from "@/stores/breadcrumbs";

export const useBreadcrumbs = (items: BreadcrumbItem[]) => {
  const set = useBreadcrumbsStore((s) => s.set);
  // JSON.stringify provides a stable string comparison so the effect only
  // re-runs when the breadcrumb content actually changes.
  const serialized = JSON.stringify(items);

  useEffect(() => {
    set(JSON.parse(serialized) as BreadcrumbItem[]);
    return () => set([]);
  }, [serialized, set]);
};
