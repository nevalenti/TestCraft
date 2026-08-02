import { fetchJson } from './http';
import { setSecret } from './log';

interface TokenResponse {
  access_token: string;
}

export const fetchToken = async (
  authority: string,
  username: string,
  password: string,
): Promise<string> => {
  const { access_token } = await fetchJson<TokenResponse>(
    `${authority}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'testcraft-web',
        username,
        password,
      }),
    },
    'Keycloak auth failed',
  );
  setSecret(access_token);

  return access_token;
};

export const fetchServiceToken = async (
  authority: string,
  clientId: string,
  clientSecret: string,
): Promise<string> => {
  const { access_token } = await fetchJson<TokenResponse>(
    `${authority}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
    'Keycloak auth failed',
  );
  setSecret(access_token);

  return access_token;
};

export const authenticate = async (
  authority: string,
  credentials:
    | { clientId: string; clientSecret: string }
    | { username: string; password: string },
): Promise<string> =>
  'clientId' in credentials
    ? fetchServiceToken(
        authority,
        credentials.clientId,
        credentials.clientSecret,
      )
    : fetchToken(authority, credentials.username, credentials.password);
