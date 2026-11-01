import { useId, useLayoutEffect } from "react";

import { type BreadcrumbItem, useBreadcrumbsStore } from "@/stores/breadcrumbs";

interface Registration {
  items: BreadcrumbItem[];
  priority: number;
  order: number;
}

const registrations = new Map<string, Registration>();
const counter = { nextOrder: 0 };

const publish = () => {
  let winner: Registration | undefined;
  for (const registration of registrations.values()) {
    if (
      !winner ||
      registration.priority > winner.priority ||
      (registration.priority === winner.priority &&
        registration.order > winner.order)
    )
      winner = registration;
  }
  if (winner) useBreadcrumbsStore.getState().set(winner.items);
};

export const useBreadcrumbs = (items: BreadcrumbItem[], priority = 0) => {
  const id = useId();
  const serialized = JSON.stringify(items);

  useLayoutEffect(() => {
    const order = registrations.get(id)?.order ?? counter.nextOrder++;
    registrations.set(id, {
      items: JSON.parse(serialized) as BreadcrumbItem[],
      priority,
      order,
    });
    publish();
  }, [id, serialized, priority]);

  useLayoutEffect(
    () => () => {
      registrations.delete(id);
      publish();
    },
    [id],
  );
};
