import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: 'Delete Project',
  description: 'This cannot be undone.',
};

describe('ConfirmDialog', () => {
  describe('when open — renders title and description', () => {
    it('shows the title', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('Delete Project')).toBeInTheDocument();
    });

    it('shows the description', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    });
  });

  describe('default confirm label — shows Delete', () => {
    it('renders a Delete button', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(
        screen.getByRole('button', { name: 'Delete' }),
      ).toBeInTheDocument();
    });
  });

  describe('given a custom confirmLabel — uses it on the confirm button', () => {
    it('renders the custom label', () => {
      render(<ConfirmDialog {...defaultProps} confirmLabel="Remove" />);
      expect(
        screen.getByRole('button', { name: 'Remove' }),
      ).toBeInTheDocument();
    });
  });

  describe('when Cancel is clicked — calls onClose', () => {
    it('invokes onClose once', async () => {
      const onClose = vi.fn();

      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('when confirm button is clicked — calls onConfirm', () => {
    it('invokes onConfirm once', async () => {
      const onConfirm = vi.fn();

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });

  describe('when isLoading is true — disables the confirm button', () => {
    it('disables the confirm button', () => {
      const { container } = render(
        <ConfirmDialog {...defaultProps} isLoading={true} />,
      );
      const buttons = container.querySelectorAll('button[type="button"]');
      const confirmBtn = [...buttons].find((button) =>
        button.classList.contains('btn-error'),
      );

      expect(confirmBtn).toBeDisabled();
    });
  });
});
