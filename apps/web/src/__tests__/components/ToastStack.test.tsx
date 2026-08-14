import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ToastStack } from '@/components/ToastStack';
import { useNotificationsStore } from '@/stores/notifications';

beforeEach(() => {
  useNotificationsStore.getState().clearAll();
});

describe('ToastStack', () => {
  describe('ToastStack — given no notifications — renders nothing', () => {
    it('produces an empty DOM element', () => {
      const { container } = render(<ToastStack />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('ToastStack — given one notification — renders its message', () => {
    it('shows the message text', () => {
      useNotificationsStore
        .getState()
        .add({ type: 'success', message: 'Project saved' });
      render(<ToastStack />);
      expect(screen.getByText('Project saved')).toBeInTheDocument();
    });
  });

  describe('ToastStack — given multiple notifications — renders all of them', () => {
    it('shows every message', () => {
      useNotificationsStore
        .getState()
        .add({ type: 'success', message: 'First' });
      useNotificationsStore
        .getState()
        .add({ type: 'error', message: 'Second' });
      render(<ToastStack />);
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('ToastStack — when the dismiss button is clicked — removes that notification', () => {
    it('takes the message out of the DOM', async () => {
      useNotificationsStore
        .getState()
        .add({ type: 'error', message: 'Something failed' });
      render(<ToastStack />);

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
      render(<ToastStack />);

      const [firstDismiss] = screen.getAllByRole('button', {
        name: /dismiss/i,
      });

      await userEvent.click(firstDismiss);

      expect(screen.getByText('Keep me')).toBeInTheDocument();
    });
  });
});
