import { beforeEach, describe, expect, it } from 'vitest';

import { useDashboardTabStore } from '@/features/dashboard/dashboardTab';

beforeEach(() => {
  useDashboardTabStore.setState({ tab: 'active' });
});

describe('useDashboardTabStore', () => {
  describe('given the initial state — defaults to active', () => {
    it('starts on the active tab', () => {
      expect(useDashboardTabStore.getState().tab).toBe('active');
    });
  });

  describe('setTab — given completed — switches the tab', () => {
    it('updates the tab to completed', () => {
      useDashboardTabStore.getState().setTab('completed');
      expect(useDashboardTabStore.getState().tab).toBe('completed');
    });
  });

  describe('setTab — given active — switches the tab back', () => {
    it('updates the tab to active', () => {
      useDashboardTabStore.getState().setTab('completed');
      useDashboardTabStore.getState().setTab('active');
      expect(useDashboardTabStore.getState().tab).toBe('active');
    });
  });
});
