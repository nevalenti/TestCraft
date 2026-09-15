import { create } from 'zustand';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsState {
  items: BreadcrumbItem[] | null;
  set: (items: BreadcrumbItem[] | null) => void;
}

export const useBreadcrumbsStore = create<BreadcrumbsState>((set) => ({
  items: null,
  set: (items) => set({ items }),
}));
