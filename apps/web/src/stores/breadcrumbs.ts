import { create } from 'zustand';

import { type BreadcrumbItem } from '@/types';

interface BreadcrumbsState {
  items: BreadcrumbItem[] | null;
  set: (items: BreadcrumbItem[] | null) => void;
}

export const useBreadcrumbsStore = create<BreadcrumbsState>((set) => ({
  items: null,
  set: (items) => set({ items }),
}));
