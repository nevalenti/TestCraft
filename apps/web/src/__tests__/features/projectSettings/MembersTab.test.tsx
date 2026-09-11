import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useRequiredParam', () => ({
  useRequiredParam: vi.fn().mockReturnValue('proj-1'),
}));

vi.mock('@/features/projects/hooks', () => ({
  useProject: vi.fn(),
}));

vi.mock('@/features/projectMembers/MembersSection', () => ({
  MembersSection: vi.fn(() => <div data-testid="members-section" />),
}));

import { useProject } from '@/features/projects/hooks';
import { MembersTab } from '@/features/projectSettings/MembersTab';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MembersTab', () => {
  describe('given the current user owns the project', () => {
    it('renders the members section', () => {
      vi.mocked(useProject).mockReturnValue({
        data: { isOwner: true },
      } as unknown as ReturnType<typeof useProject>);

      render(<MembersTab />);

      expect(screen.getByTestId('members-section')).toBeInTheDocument();
    });
  });

  describe('given the current user does not own the project', () => {
    it('shows an owners-only error state instead of the members section', () => {
      vi.mocked(useProject).mockReturnValue({
        data: { isOwner: false },
      } as unknown as ReturnType<typeof useProject>);

      render(<MembersTab />);

      expect(screen.queryByTestId('members-section')).not.toBeInTheDocument();
      expect(screen.getByText('Owners only')).toBeInTheDocument();
    });
  });
});
