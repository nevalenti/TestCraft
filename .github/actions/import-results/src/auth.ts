import * as core from "@actions/core";

interface TokenResponse {
  access_token: string;
}

export const fetchToken = async (
  authority: string,
  username: string,
  password: string,
): Promise<string> => {
  const res = await fetch(`${authority}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: "testcraft-web",
      username,
      password,
    }),
  });

  if (!res.ok) {
    throw new Error(`Keycloak auth failed: ${res.status} ${res.statusText}`);
  }

  const { access_token } = (await res.json()) as TokenResponse;
  core.setSecret(access_token);

  return access_token;
};
