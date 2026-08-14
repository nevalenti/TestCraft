import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@/auth/keycloak', () => ({
  default: { tokenParsed: {}, logout: vi.fn() },
}));

vi.mock('@/features/account/hooks', () => ({
  useAvatarUrl: vi.fn(() => ({ data: undefined })),
  useUploadAvatar: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('@/hooks/useBreadcrumbs', () => ({ useBreadcrumbs: vi.fn() }));

vi.mock('@/lib/env', () => ({
  env: {
    VITE_KEYCLOAK_URL: 'https://auth.example.com',
    VITE_KEYCLOAK_REALM: 'testcraft',
  },
}));

import keycloak from '@/auth/keycloak';
import { useAvatarUrl, useUploadAvatar } from '@/features/account/hooks';
import { AccountPage } from '@/pages/AccountPage/AccountPage';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(keycloak).tokenParsed = {
    name: 'Ada Lovelace',
    given_name: 'Ada',
    family_name: 'Lovelace',
    preferred_username: 'ada',
    email: 'ada@example.com',
  };
  vi.mocked(useAvatarUrl).mockReturnValue({ data: undefined } as never);
  vi.mocked(useUploadAvatar).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
});

describe('AccountPage', () => {
  describe('given a Keycloak token — renders the profile fields', () => {
    it('shows first name, last name, username, and email', () => {
      render(<AccountPage />);

      expect(screen.getByText('Ada')).toBeInTheDocument();
      expect(screen.getByText('Lovelace')).toBeInTheDocument();
      expect(screen.getByText('ada')).toBeInTheDocument();
      expect(screen.getAllByText('ada@example.com')[0]).toBeInTheDocument();
    });

    it('links "Manage account" to the Keycloak account console', () => {
      render(<AccountPage />);

      expect(
        screen.getByRole('link', { name: /manage account/i }),
      ).toHaveAttribute(
        'href',
        'https://auth.example.com/realms/testcraft/account',
      );
    });
  });

  describe('given a photo is chosen — uploads it', () => {
    it('calls the upload mutation with the selected file', async () => {
      const mutate = vi.fn();
      vi.mocked(useUploadAvatar).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      const { container } = render(<AccountPage />);

      const file = new File(['img'], 'avatar.png', { type: 'image/png' });
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      await userEvent.upload(input, file);

      expect(mutate).toHaveBeenCalledWith(file);
    });
  });

  describe('given the sign-out flow', () => {
    it('opens the confirm dialog without signing out', async () => {
      render(<AccountPage />);

      await userEvent.click(
        screen.getAllByRole('button', { name: /sign out/i })[0],
      );

      expect(screen.getByText('Sign out?')).toBeInTheDocument();
      expect(keycloak.logout).not.toHaveBeenCalled();
    });

    it('cancels without signing out', async () => {
      render(<AccountPage />);

      await userEvent.click(
        screen.getAllByRole('button', { name: /sign out/i })[0],
      );
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(keycloak.logout).not.toHaveBeenCalled();
    });

    it('signs out when confirmed', async () => {
      render(<AccountPage />);

      await userEvent.click(
        screen.getAllByRole('button', { name: /sign out/i })[0],
      );
      const confirmButtons = screen.getAllByRole('button', {
        name: /sign out/i,
      });
      await userEvent.click(confirmButtons.at(-1)!);

      expect(keycloak.logout).toHaveBeenCalledWith({
        redirectUri: `${location.origin}/`,
      });
    });
  });
});
