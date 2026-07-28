import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ResourceActions } from '@/components/ui/ResourceActions';

describe('ResourceActions', () => {
  describe('given a label — renders accessible edit and delete buttons', () => {
    it('renders an edit button with the label in its aria-label', () => {
      render(
        <ResourceActions onEdit={vi.fn()} onDelete={vi.fn()} label="project" />,
      );
      expect(
        screen.getByRole('button', { name: 'Edit project' }),
      ).toBeInTheDocument();
    });

    it('renders a delete button with the label in its aria-label', () => {
      render(
        <ResourceActions onEdit={vi.fn()} onDelete={vi.fn()} label="project" />,
      );
      expect(
        screen.getByRole('button', { name: 'Delete project' }),
      ).toBeInTheDocument();
    });
  });

  describe('when the edit button is clicked — calls onEdit', () => {
    it('invokes onEdit once', async () => {
      const onEdit = vi.fn();

      render(
        <ResourceActions onEdit={onEdit} onDelete={vi.fn()} label="suite" />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Edit suite' }));
      expect(onEdit).toHaveBeenCalledOnce();
    });
  });

  describe('when the delete button is clicked — calls onDelete', () => {
    it('invokes onDelete once', async () => {
      const onDelete = vi.fn();

      render(
        <ResourceActions onEdit={vi.fn()} onDelete={onDelete} label="suite" />,
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Delete suite' }),
      );
      expect(onDelete).toHaveBeenCalledOnce();
    });
  });
});
