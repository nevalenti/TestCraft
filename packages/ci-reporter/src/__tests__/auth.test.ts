import { afterEach, describe, expect, it, vi } from 'vitest';

import { authenticate, fetchServiceToken, fetchToken } from '../core/auth';
import * as log from '../core/log';

describe('fetchToken', () => {
  const fetchMock = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  describe('fetchToken — given Keycloak returns a token — posts a password-grant request and returns the access token', () => {
    it('returns the access_token from the response', async () => {
      vi.stubGlobal('fetch', fetchMock);
      fetchMock.mockResolvedValue(
        Response.json(
          { access_token: 'the-token' },
          {
            status: 200,
          },
        ),
      );

      const token = await fetchToken(
        'https://kc.example.com/realms/testcraft',
        'user',
        'pass',
      );

      expect(token).toBe('the-token');
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        'https://kc.example.com/realms/testcraft/protocol/openid-connect/token',
      );
      expect(init.method).toBe('POST');
      const body = init.body as URLSearchParams;
      expect(body.get('grant_type')).toBe('password');
      expect(body.get('client_id')).toBe('testcraft-web');
      expect(body.get('username')).toBe('user');
      expect(body.get('password')).toBe('pass');
    });

    it('registers the returned token as a secret so later logs redact it', async () => {
      vi.stubGlobal('fetch', fetchMock);
      fetchMock.mockResolvedValue(
        Response.json(
          { access_token: 'shh-do-not-log-me' },
          {
            status: 200,
          },
        ),
      );
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await fetchToken('https://kc.example.com', 'user', 'pass');
      log.info('token was shh-do-not-log-me');

      expect(logSpy).toHaveBeenCalledWith('token was ***');
      logSpy.mockRestore();
    });
  });

  describe('fetchToken — given Keycloak rejects the credentials — throws with the auth-failure context', () => {
    it('rejects with a descriptive error', async () => {
      vi.stubGlobal('fetch', fetchMock);
      fetchMock.mockResolvedValue(
        new Response('invalid credentials', { status: 401 }),
      );

      await expect(
        fetchToken('https://kc.example.com', 'user', 'wrong-pass'),
      ).rejects.toThrow(/Keycloak auth failed: 401/);
    });
  });
});

describe('fetchServiceToken', () => {
  const fetchMock = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('posts a client-credentials grant request and returns the access token', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      Response.json(
        { access_token: 'service-token' },
        {
          status: 200,
        },
      ),
    );

    const token = await fetchServiceToken(
      'https://kc.example.com/realms/testcraft',
      'testcraft-ci',
      'the-client-secret',
    );

    expect(token).toBe('service-token');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get('grant_type')).toBe('client_credentials');
    expect(body.get('client_id')).toBe('testcraft-ci');
    expect(body.get('client_secret')).toBe('the-client-secret');
    expect(body.has('username')).toBe(false);
  });

  it('rejects with a descriptive error when Keycloak rejects the credentials', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      new Response('invalid client', { status: 401 }),
    );

    await expect(
      fetchServiceToken('https://kc.example.com', 'testcraft-ci', 'wrong'),
    ).rejects.toThrow(/Keycloak auth failed: 401/);
  });
});

describe('authenticate', () => {
  const fetchMock = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('uses the client-credentials grant when given a clientId/clientSecret pair', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      Response.json({ access_token: 'x' }, { status: 200 }),
    );

    await authenticate('https://kc.example.com', {
      clientId: 'testcraft-ci',
      clientSecret: 'secret',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get('grant_type')).toBe('client_credentials');
  });

  it('falls back to the password grant when given a username/password pair', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      Response.json({ access_token: 'x' }, { status: 200 }),
    );

    await authenticate('https://kc.example.com', {
      username: 'user',
      password: 'pass',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get('grant_type')).toBe('password');
  });
});
