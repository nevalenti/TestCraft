import { beforeEach, describe, expect, it } from 'vitest';

import { useViewModeStore } from '@/stores/viewMode';

beforeEach(() => {
  useViewModeStore.setState({ viewMode: 'grid' });
});

describe('useViewModeStore', () => {
  describe('given the initial state — defaults to grid', () => {
    it('starts with grid view', () => {
      expect(useViewModeStore.getState().viewMode).toBe('grid');
    });
  });

  describe('setViewMode — given list — switches the view mode', () => {
    it('updates the view mode to list', () => {
      useViewModeStore.getState().setViewMode('list');
      expect(useViewModeStore.getState().viewMode).toBe('list');
    });
  });

  describe('setViewMode — given grid — switches the view mode back', () => {
    it('updates the view mode to grid', () => {
      useViewModeStore.getState().setViewMode('list');
      useViewModeStore.getState().setViewMode('grid');
      expect(useViewModeStore.getState().viewMode).toBe('grid');
    });
  });
});
