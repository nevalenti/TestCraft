import type { DashboardRunsTab } from "@/stores/dashboardTab";

export const RUNS_PANEL_ID = "dashboard-runs-panel";

export const runsTabId = (tab: DashboardRunsTab) => `dashboard-runs-tab-${tab}`;
