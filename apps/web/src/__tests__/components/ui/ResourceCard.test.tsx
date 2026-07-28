import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ResourceCard } from '@/components/ui/ResourceCard';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
    'aria-label': ariaLabel,
  }: {
    children?: React.ReactNode;
    to: string;
    className?: string;
    'aria-label'?: string;
  }) => (
    <a href={to} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

describe('ResourceCard', () => {
  describe('given children — renders them', () => {
    it('displays the child content', () => {
      render(
        <ResourceCard onEdit={vi.fn()} onDelete={vi.fn()} label="project">
          <span>Card body</span>
        </ResourceCard>,
      );
      expect(screen.getByText('Card body')).toBeInTheDocument();
    });
  });

  describe('given a to prop — renders a link to that route', () => {
    it('renders an anchor with the correct href', () => {
      render(
        <ResourceCard
          to="/projects/proj-1"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          label="project"
        >
          <span>content</span>
        </ResourceCard>,
      );
      expect(
        screen.getByRole('link', { name: 'Open project' }),
      ).toHaveAttribute('href', '/projects/proj-1');
    });
  });

  describe('without a to prop — does not render a navigation link', () => {
    it('renders no link', () => {
      render(
        <ResourceCard onEdit={vi.fn()} onDelete={vi.fn()} label="project">
          <span>content</span>
        </ResourceCard>,
      );
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('given a testId — sets data-testid on the wrapper', () => {
    it('attaches the testId attribute', () => {
      render(
        <ResourceCard
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          label="project"
          testId="project-card"
        >
          <span>content</span>
        </ResourceCard>,
      );
      expect(screen.getByTestId('project-card')).toBeInTheDocument();
    });
  });

  describe('when edit is clicked — calls onEdit', () => {
    it('invokes onEdit once', async () => {
      const onEdit = vi.fn();

      render(
        <ResourceCard onEdit={onEdit} onDelete={vi.fn()} label="project">
          <span>content</span>
        </ResourceCard>,
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Edit project' }),
      );
      expect(onEdit).toHaveBeenCalledOnce();
    });
  });

  describe('when delete is clicked — calls onDelete', () => {
    it('invokes onDelete once', async () => {
      const onDelete = vi.fn();

      render(
        <ResourceCard onEdit={vi.fn()} onDelete={onDelete} label="project">
          <span>content</span>
        </ResourceCard>,
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Delete project' }),
      );
      expect(onDelete).toHaveBeenCalledOnce();
    });
  });
});
