import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/projectMembers/hooks', () => ({
  useProjectMembers: vi.fn(),
  useAddProjectMember: vi.fn(),
  useRemoveProjectMember: vi.fn(),
}));

import {
  useAddProjectMember,
  useProjectMembers,
  useRemoveProjectMember,
} from '@/features/projectMembers/hooks';
import { MembersSection } from '@/features/projectMembers/MembersSection';

const makeMember = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'm1',
  email: 'teammate@example.com',
  displayName: null,
  createdAt: '2026-01-10T00:00:00Z',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useProjectMembers).mockReturnValue({
    data: [],
    isError: false,
    error: null,
  } as never);
  vi.mocked(useAddProjectMember).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  vi.mocked(useRemoveProjectMember).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
});

describe('MembersSection', () => {
  describe('given an error loading members — shows the error state', () => {
    it('renders the failure message', () => {
      vi.mocked(useProjectMembers).mockReturnValue({
        data: undefined,
        isError: true,
        error: new Error('boom'),
      } as never);
      render(<MembersSection projectId="proj-1" />);
      expect(screen.getByText('Failed to load members')).toBeInTheDocument();
    });
  });

  describe('given existing members — lists them', () => {
    it('shows the display name when set', () => {
      vi.mocked(useProjectMembers).mockReturnValue({
        data: [makeMember({ displayName: 'Ada Lovelace' })],
        isError: false,
        error: null,
      } as never);
      render(<MembersSection projectId="proj-1" />);
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    });

    it('falls back to the email when no display name is set', () => {
      vi.mocked(useProjectMembers).mockReturnValue({
        data: [makeMember({ displayName: null, email: 'ada@example.com' })],
        isError: false,
        error: null,
      } as never);
      render(<MembersSection projectId="proj-1" />);
      expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    });
  });

  describe('given the Add button — is disabled with no email entered', () => {
    it('disables the button', () => {
      render(<MembersSection projectId="proj-1" />);
      expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled();
    });
  });

  describe('given an email is entered — Add invites the member', () => {
    it('calls the mutation with the email', async () => {
      const mutate = vi.fn();
      vi.mocked(useAddProjectMember).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<MembersSection projectId="proj-1" />);

      await userEvent.type(
        screen.getByPlaceholderText('teammate@example.com'),
        'new@example.com',
      );
      await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

      expect(mutate).toHaveBeenCalledWith(
        { email: 'new@example.com' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  describe('given Remove is clicked on a member — removes them', () => {
    it('calls the mutation with the member id', async () => {
      const mutate = vi.fn();
      vi.mocked(useProjectMembers).mockReturnValue({
        data: [makeMember({ id: 'm1', email: 'a@example.com' })],
        isError: false,
        error: null,
      } as never);
      vi.mocked(useRemoveProjectMember).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<MembersSection projectId="proj-1" />);

      await userEvent.click(
        screen.getByRole('button', { name: /remove a@example.com/i }),
      );

      expect(mutate).toHaveBeenCalledWith('m1');
    });
  });
});
