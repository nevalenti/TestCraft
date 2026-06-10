import * as core from "@actions/core";

import { fetchJson } from "./http";

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
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "testcraft-web",
        username,
        password,
      }),
    },
    "Keycloak auth failed",
  );
  core.setSecret(access_token);

  return access_token;
};
