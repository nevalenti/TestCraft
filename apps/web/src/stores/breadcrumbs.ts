import { create } from "zustand";

import { type BreadcrumbItem } from "@/types";

interface BreadcrumbsState {
  items: BreadcrumbItem[];
  set: (items: BreadcrumbItem[]) => void;
}

export const useBreadcrumbsStore = create<BreadcrumbsState>((set) => ({
  items: [],
  set: (items) => set({ items }),
}));
