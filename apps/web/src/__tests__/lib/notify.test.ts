import { describe, expect, it, vi } from 'vitest';

vi.mock('@/stores/notifications', () => ({
  useNotificationsStore: { getState: vi.fn() },
}));

import { notify } from '@/lib/notify';
import { useNotificationsStore } from '@/stores/notifications';

describe('notify', () => {
  describe('given no type — defaults to success', () => {
    it('adds a success notification with a 6000ms timeout', () => {
      const add = vi.fn();
      vi.mocked(useNotificationsStore.getState).mockReturnValue({
        add,
      } as any);

      notify('Saved!');

      expect(add).toHaveBeenCalledWith({
        type: 'success',
        message: 'Saved!',
        timeout: 6000,
      });
    });
  });

  describe('given an explicit type — uses it instead of the default', () => {
    it('adds an error notification', () => {
      const add = vi.fn();
      vi.mocked(useNotificationsStore.getState).mockReturnValue({
        add,
      } as any);

      notify('Failed', 'error');

      expect(add).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed',
        timeout: 6000,
      });
    });
  });
});
