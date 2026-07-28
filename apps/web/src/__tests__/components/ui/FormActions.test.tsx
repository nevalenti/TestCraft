import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FormActions } from '@/components/ui/FormActions';

describe('FormActions', () => {
  describe('given default props — renders Cancel and Save buttons', () => {
    it('shows a Cancel button', () => {
      render(<FormActions onCancel={vi.fn()} isLoading={false} />);
      expect(
        screen.getByRole('button', { name: 'Cancel' }),
      ).toBeInTheDocument();
    });

    it('shows a Save submit button', () => {
      render(<FormActions onCancel={vi.fn()} isLoading={false} />);
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('given a custom label — shows it on the submit button', () => {
    it('uses the provided label instead of Save', () => {
      render(
        <FormActions onCancel={vi.fn()} isLoading={false} label="Create" />,
      );
      expect(
        screen.getByRole('button', { name: 'Create' }),
      ).toBeInTheDocument();
    });
  });

  describe('when Cancel is clicked — calls onCancel', () => {
    it('invokes the handler once', async () => {
      const onCancel = vi.fn();

      render(<FormActions onCancel={onCancel} isLoading={false} />);
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe('when isLoading is true — disables the submit button and shows a spinner', () => {
    it('disables the submit button', () => {
      const { container } = render(
        <FormActions onCancel={vi.fn()} isLoading={true} />,
      );

      expect(container.querySelector('button[type="submit"]')).toBeDisabled();
    });

    it('hides the label text and shows a spinner', () => {
      render(<FormActions onCancel={vi.fn()} isLoading={true} />);
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
  });
});
