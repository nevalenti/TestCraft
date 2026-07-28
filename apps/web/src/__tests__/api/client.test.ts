import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestUse = vi.fn();
const responseUse = vi.fn();

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: requestUse },
        response: { use: responseUse },
      },
    })),
  },
}));

vi.mock('@/auth/keycloak', () => ({
  default: {
    authenticated: false,
    token: undefined,
    updateToken: vi.fn(),
    login: vi.fn(),
  },
}));

vi.mock('@/lib/env', () => ({
  env: { VITE_API_URL: 'https://api.example.com' },
}));

vi.mock('@/stores/notifications', () => ({
  useNotificationsStore: { getState: vi.fn(() => ({ add: vi.fn() })) },
}));

import keycloak from '@/auth/keycloak';
import { useNotificationsStore } from '@/stores/notifications';

describe('api client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('request interceptor — given an authenticated session', () => {
    it('attaches a fresh bearer token after refreshing', async () => {
      vi.mocked(keycloak).authenticated = true;
      vi.mocked(keycloak).token = 'fresh-token';
      vi.mocked(keycloak.updateToken).mockResolvedValue(true);
      await import('@/api/client');

      const requestHandler = requestUse.mock.calls[0][0];
      const config = await requestHandler({ headers: {} as any });

      expect(keycloak.updateToken).toHaveBeenCalledWith(30);
      expect(config.headers.Authorization).toBe('Bearer fresh-token');
    });

    it('redirects to login when token refresh fails', async () => {
      vi.mocked(keycloak).authenticated = true;
      vi.mocked(keycloak.updateToken).mockRejectedValue(new Error('expired'));
      await import('@/api/client');

      const requestHandler = requestUse.mock.calls[0][0];
      await requestHandler({ headers: {} as any });

      expect(keycloak.login).toHaveBeenCalled();
    });
  });

  describe('request interceptor — given no authenticated session', () => {
    it('does not attach an Authorization header', async () => {
      vi.mocked(keycloak).authenticated = false;
      await import('@/api/client');

      const requestHandler = requestUse.mock.calls[0][0];
      const config = await requestHandler({ headers: {} as any });

      expect(config.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor — given a failed non-GET request', () => {
    it("surfaces the API's problem-detail message as an error toast", async () => {
      const add = vi.fn();
      vi.mocked(useNotificationsStore.getState).mockReturnValue({
        add,
      } as any);
      await import('@/api/client');

      const errorHandler = responseUse.mock.calls[0][1];
      await expect(
        errorHandler({
          config: { method: 'post' },
          response: { data: { detail: 'Name is required' } },
        }),
      ).rejects.toBeDefined();

      expect(add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Name is required',
        }),
      );
    });

    it('falls back to a generic message when no detail is present', async () => {
      const add = vi.fn();
      vi.mocked(useNotificationsStore.getState).mockReturnValue({
        add,
      } as any);
      await import('@/api/client');

      const errorHandler = responseUse.mock.calls[0][1];
      await expect(
        errorHandler({ config: { method: 'put' }, response: undefined }),
      ).rejects.toBeDefined();

      expect(add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'An unexpected error occurred.',
        }),
      );
    });
  });

  describe('response interceptor — given a failed GET request', () => {
    it('does not show an error toast', async () => {
      const add = vi.fn();
      vi.mocked(useNotificationsStore.getState).mockReturnValue({
        add,
      } as any);
      await import('@/api/client');

      const errorHandler = responseUse.mock.calls[0][1];
      await expect(
        errorHandler({ config: { method: 'get' }, response: undefined }),
      ).rejects.toBeDefined();

      expect(add).not.toHaveBeenCalled();
    });
  });

  describe('response interceptor — given a successful response', () => {
    it('passes it through unchanged', async () => {
      await import('@/api/client');

      const successHandler = responseUse.mock.calls[0][0];
      const response = { data: { ok: true } };

      expect(successHandler(response)).toBe(response);
    });
  });
});
