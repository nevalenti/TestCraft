import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    'aria-label': ariaLabel,
  }: {
    children?: React.ReactNode;
    to: string;
    'aria-label'?: string;
  }) => (
    <a href={to} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

import type { Project } from '@testcraft/types';

import { ProjectCard } from '@/pages/ProjectsPage/ProjectCard';

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Alpha',
  description: 'An alpha project',
  suiteCount: 3,
  runCount: 2,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
  isOwner: true,
  ...overrides,
});

describe('ProjectCard', () => {
  describe('renders project information', () => {
    it('displays the project name', () => {
      render(
        <ProjectCard
          project={makeProject()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText('Alpha')).toBeInTheDocument();
    });

    it('displays the project description', () => {
      render(
        <ProjectCard
          project={makeProject()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText('An alpha project')).toBeInTheDocument();
    });

    it('shows suite and run counts', () => {
      render(
        <ProjectCard
          project={makeProject({ suiteCount: 3, runCount: 2 })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText('3 suites')).toBeInTheDocument();
      expect(screen.getByText('2 runs')).toBeInTheDocument();
    });

    it('uses singular label for count of 1', () => {
      render(
        <ProjectCard
          project={makeProject({ suiteCount: 1, runCount: 1 })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText('1 suite')).toBeInTheDocument();
      expect(screen.getByText('1 run')).toBeInTheDocument();
    });
  });

  describe('without a description — shows placeholder text', () => {
    it('renders the No description placeholder', () => {
      render(
        <ProjectCard
          project={makeProject({ description: undefined })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText('No description')).toBeInTheDocument();
    });
  });

  describe('links to the project detail page', () => {
    it('renders a link to the correct route', () => {
      render(
        <ProjectCard
          project={makeProject()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByRole('link', { name: 'Open Alpha' })).toHaveAttribute(
        'href',
        '/projects/proj-1',
      );
    });
  });

  describe('action buttons', () => {
    it('calls onEdit when Edit is clicked', async () => {
      const onEdit = vi.fn();

      render(
        <ProjectCard
          project={makeProject()}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Edit Alpha' }));
      expect(onEdit).toHaveBeenCalledOnce();
    });

    it('calls onDelete when Delete is clicked', async () => {
      const onDelete = vi.fn();

      render(
        <ProjectCard
          project={makeProject()}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />,
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Delete Alpha' }),
      );
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it('hides the Delete action for a project the user does not own', () => {
      render(
        <ProjectCard
          project={makeProject({ isOwner: false })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'Delete Alpha' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Edit Alpha' }),
      ).toBeInTheDocument();
    });
  });
});
