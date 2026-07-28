import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/keycloak', () => ({
  default: { init: vi.fn() },
}));

import { AuthProvider } from '@/auth/AuthProvider';
import keycloak from '@/auth/keycloak';

beforeEach(() => {
  vi.clearAllMocks();
  history.pushState({}, '', '/');
});

describe('AuthProvider', () => {
  describe('while keycloak is initializing', () => {
    it('shows a loading spinner instead of the children', () => {
      vi.mocked(keycloak.init).mockReturnValue(new Promise(() => {}));
      render(
        <AuthProvider>
          <p>Protected content</p>
        </AuthProvider>,
      );

      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });
  });

  describe('given a non-share route', () => {
    it('initializes keycloak with login-required', () => {
      vi.mocked(keycloak.init).mockReturnValue(new Promise(() => {}));
      render(
        <AuthProvider>
          <p>Protected content</p>
        </AuthProvider>,
      );

      expect(keycloak.init).toHaveBeenCalledWith(
        expect.objectContaining({ onLoad: 'login-required' }),
      );
    });
  });

  describe('given a public share route', () => {
    it('initializes keycloak with check-sso instead of forcing a login', () => {
      history.pushState({}, '', '/share/abc123');
      vi.mocked(keycloak.init).mockReturnValue(new Promise(() => {}));
      render(
        <AuthProvider>
          <p>Protected content</p>
        </AuthProvider>,
      );

      expect(keycloak.init).toHaveBeenCalledWith(
        expect.objectContaining({ onLoad: 'check-sso' }),
      );
    });
  });

  describe('once keycloak initializes successfully', () => {
    it('renders the children', async () => {
      vi.mocked(keycloak.init).mockResolvedValue(true);
      render(
        <AuthProvider>
          <p>Protected content</p>
        </AuthProvider>,
      );

      await waitFor(() =>
        expect(screen.getByText('Protected content')).toBeInTheDocument(),
      );
    });
  });

  describe('when keycloak initialization fails', () => {
    it('shows an error message instead of the children', async () => {
      vi.mocked(keycloak.init).mockRejectedValue(new Error('network down'));
      render(
        <AuthProvider>
          <p>Protected content</p>
        </AuthProvider>,
      );

      await waitFor(() =>
        expect(
          screen.getByText('Auth initialisation failed'),
        ).toBeInTheDocument(),
      );
      expect(screen.getByText('Error: network down')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });
  });
});
