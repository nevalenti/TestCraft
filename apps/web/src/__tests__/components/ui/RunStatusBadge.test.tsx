import { TestRunStatus } from '@testcraft/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RunStatusBadge } from '@/components/ui/RunStatusBadge';

describe('RunStatusBadge', () => {
  describe('given Active — renders the correct label and warning style', () => {
    it('displays Active with the warning color class', () => {
      render(<RunStatusBadge status={TestRunStatus.Active} />);
      const badge = screen.getByText(TestRunStatus.Active);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('text-warning');
    });
  });

  describe('given Completed — renders the correct label and success style', () => {
    it('displays Completed with the success color class', () => {
      render(<RunStatusBadge status={TestRunStatus.Completed} />);
      const badge = screen.getByText(TestRunStatus.Completed);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('text-success');
    });
  });

  describe('given Archived — renders the correct label and neutral style', () => {
    it('displays Archived with the neutral color class', () => {
      render(<RunStatusBadge status={TestRunStatus.Archived} />);
      const badge = screen.getByText(TestRunStatus.Archived);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('text-base-content/70');
    });
  });
});
