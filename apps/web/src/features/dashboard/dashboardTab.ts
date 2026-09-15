import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RunsTab = 'active' | 'completed';

interface DashboardTabState {
  tab: RunsTab;
  setTab: (tab: RunsTab) => void;
}

export const useDashboardTabStore = create<DashboardTabState>()(
  persist(
    (set) => ({
      tab: 'active',
      setTab: (tab) => set({ tab }),
    }),
    { name: 'testcraft.dashboard-tab' },
  ),
);
