import { create } from "zustand";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsState {
  items: BreadcrumbItem[];
  set: (items: BreadcrumbItem[]) => void;
}

export const useBreadcrumbsStore = create<BreadcrumbsState>((set) => ({
  items: [],
  set: (items) => set({ items }),
}));
