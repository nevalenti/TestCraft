import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardRunsTab = "active" | "completed";

interface DashboardTabState {
  tab: DashboardRunsTab;
  setTab: (tab: DashboardRunsTab) => void;
}

export const useDashboardTabStore = create<DashboardTabState>()(
  persist(
    (set) => ({
      tab: "active",
      setTab: (tab) => set({ tab }),
    }),
    { name: "testcraft.dashboard-tab" },
  ),
);
