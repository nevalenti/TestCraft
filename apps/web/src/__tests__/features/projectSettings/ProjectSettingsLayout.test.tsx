import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children?: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  Outlet: () => null,
}));

vi.mock('@/hooks/useRequiredParam', () => ({
  useRequiredParam: vi.fn().mockReturnValue('proj-1'),
}));

vi.mock('@/features/projects/hooks', () => ({
  useProject: vi.fn(),
}));

import { useProject } from '@/features/projects/hooks';
import { ProjectSettingsLayout } from '@/features/projectSettings/ProjectSettingsLayout';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProjectSettingsLayout', () => {
  it('always renders the API Tokens and Notifications tabs', () => {
    vi.mocked(useProject).mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useProject>);

    render(<ProjectSettingsLayout />);

    expect(
      screen.getByRole('link', { name: /api tokens/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /notifications/i }),
    ).toBeInTheDocument();
  });

  describe('given the current user owns the project', () => {
    it('renders the Members tab', () => {
      vi.mocked(useProject).mockReturnValue({
        data: { isOwner: true },
      } as unknown as ReturnType<typeof useProject>);

      render(<ProjectSettingsLayout />);

      expect(
        screen.getByRole('link', { name: /members/i }),
      ).toBeInTheDocument();
    });
  });

  describe('given the current user does not own the project', () => {
    it('hides the Members tab', () => {
      vi.mocked(useProject).mockReturnValue({
        data: { isOwner: false },
      } as unknown as ReturnType<typeof useProject>);

      render(<ProjectSettingsLayout />);

      expect(
        screen.queryByRole('link', { name: /members/i }),
      ).not.toBeInTheDocument();
    });
  });
});
