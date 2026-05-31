import { useLayoutEffect } from "react";

import { useBreadcrumbsStore } from "@/stores/breadcrumbs";
import { type BreadcrumbItem } from "@/types";

export const useBreadcrumbs = (items: BreadcrumbItem[]) => {
  const set = useBreadcrumbsStore((s) => s.set);
  const serialized = JSON.stringify(items);

  useLayoutEffect(() => {
    set(JSON.parse(serialized) as BreadcrumbItem[]);
    return () => set([]);
  }, [serialized, set]);
};
