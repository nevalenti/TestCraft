import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { Notifications } from '@/components/Notifications';
import { useNotificationsStore } from '@/stores/notifications';

beforeEach(() => {
  useNotificationsStore.getState().clearAll();
});

describe('Notifications', () => {
  describe('Notifications — given no notifications — renders nothing', () => {
    it('produces an empty DOM element', () => {
      const { container } = render(<Notifications />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Notifications — given one notification — renders its message', () => {
    it('shows the message text', () => {
      useNotificationsStore
        .getState()
        .add({ type: 'success', message: 'Project saved' });
      render(<Notifications />);
      expect(screen.getByText('Project saved')).toBeInTheDocument();
    });
  });

  describe('Notifications — given multiple notifications — renders all of them', () => {
    it('shows every message', () => {
      useNotificationsStore
        .getState()
        .add({ type: 'success', message: 'First' });
      useNotificationsStore
        .getState()
        .add({ type: 'error', message: 'Second' });
      render(<Notifications />);
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('Notifications — when the dismiss button is clicked — removes that notification', () => {
    it('takes the message out of the DOM', async () => {
      useNotificationsStore
        .getState()
        .add({ type: 'error', message: 'Something failed' });
      render(<Notifications />);

      await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));

      expect(screen.queryByText('Something failed')).not.toBeInTheDocument();
    });

    it('leaves other notifications visible', async () => {
      useNotificationsStore
        .getState()
        .add({ type: 'error', message: 'Remove me' });
      useNotificationsStore
        .getState()
        .add({ type: 'info', message: 'Keep me' });
      render(<Notifications />);

      const [firstDismiss] = screen.getAllByRole('button', {
        name: /dismiss/i,
      });

      await userEvent.click(firstDismiss);

      expect(screen.getByText('Keep me')).toBeInTheDocument();
    });
  });
});
