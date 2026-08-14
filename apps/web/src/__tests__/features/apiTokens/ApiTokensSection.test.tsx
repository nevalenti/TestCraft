import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/apiTokens/hooks', () => ({
  useApiTokens: vi.fn(),
  useCreateApiToken: vi.fn(),
  useRevokeApiToken: vi.fn(),
}));

import { ApiTokensSection } from '@/features/apiTokens/ApiTokensSection';
import {
  useApiTokens,
  useCreateApiToken,
  useRevokeApiToken,
} from '@/features/apiTokens/hooks';

const makeToken = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 't1',
  name: 'CI pipeline',
  createdAt: '2026-01-10T00:00:00Z',
  lastUsedAt: null,
  expiresAt: null,
  isRevoked: false,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
  vi.mocked(useApiTokens).mockReturnValue({
    data: [],
    isError: false,
    error: null,
  } as never);
  vi.mocked(useCreateApiToken).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  vi.mocked(useRevokeApiToken).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
});

describe('ApiTokensSection', () => {
  describe('given an error loading tokens — shows the error state', () => {
    it('renders the failure message', () => {
      vi.mocked(useApiTokens).mockReturnValue({
        data: undefined,
        isError: true,
        error: new Error('boom'),
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);
      expect(screen.getByText('Failed to load API tokens')).toBeInTheDocument();
    });
  });

  describe('given existing tokens — lists them', () => {
    it('shows the token name and creation date', () => {
      vi.mocked(useApiTokens).mockReturnValue({
        data: [makeToken({ name: 'CI pipeline' })],
        isError: false,
        error: null,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);
      expect(screen.getByText('CI pipeline')).toBeInTheDocument();
      expect(screen.getByText(/Created/)).toBeInTheDocument();
    });

    it('hides the revoke button for an already-revoked token', () => {
      vi.mocked(useApiTokens).mockReturnValue({
        data: [makeToken({ isRevoked: true })],
        isError: false,
        error: null,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);
      expect(
        screen.queryByRole('button', { name: /revoke token/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/revoked/)).toBeInTheDocument();
    });
  });

  describe('given the create form is submitted — creates a token', () => {
    it('calls the mutation with the name and expiry', async () => {
      const mutate = vi.fn();
      vi.mocked(useCreateApiToken).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);

      await userEvent.type(
        screen.getByPlaceholderText('e.g. CI pipeline'),
        'CI pipeline',
      );
      await userEvent.click(screen.getByRole('button', { name: /create/i }));

      expect(mutate).toHaveBeenCalledWith(
        { name: 'CI pipeline', expiresAt: undefined },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });

    it('reveals the new token and copies it to the clipboard', async () => {
      const mutate = vi.fn((_input, opts) =>
        opts.onSuccess({ id: 't1', name: 'CI pipeline', token: 'secret-abc' }),
      );
      vi.mocked(useCreateApiToken).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);

      await userEvent.type(
        screen.getByPlaceholderText('e.g. CI pipeline'),
        'CI pipeline',
      );
      await userEvent.click(screen.getByRole('button', { name: /create/i }));

      const tokenInput = screen.getByDisplayValue(
        'secret-abc',
      ) as HTMLInputElement;
      expect(tokenInput).toHaveAttribute('type', 'password');

      const copyButton = screen.getByRole('button', { name: /copy/i });
      const revealButton = copyButton.previousElementSibling as HTMLElement;
      await userEvent.click(revealButton);
      expect(tokenInput).toHaveAttribute('type', 'text');

      await userEvent.click(copyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('secret-abc');
    });
  });

  describe('given Revoke is clicked — revokes the token', () => {
    it('calls the mutation with the token id', async () => {
      const mutate = vi.fn();
      vi.mocked(useApiTokens).mockReturnValue({
        data: [makeToken({ id: 't1' })],
        isError: false,
        error: null,
      } as never);
      vi.mocked(useRevokeApiToken).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);

      await userEvent.click(
        screen.getByRole('button', { name: /revoke token/i }),
      );

      expect(mutate).toHaveBeenCalledWith('t1');
    });
  });
});
