import jwt from "jsonwebtoken";
import jwksClient, { JwksClient } from "jwks-rsa";

import { config } from "@/infrastructure/config";

let client: JwksClient | null = null;

const getClient = (): JwksClient => {
  if (client) return client;

  if (
    config.keycloak.requireHttpsMetadata &&
    !config.keycloak.authority.startsWith("https://")
  ) {
    throw new Error(
      `KEYCLOAK_REQUIRE_HTTPS_METADATA is enabled but KEYCLOAK_AUTHORITY is not HTTPS: ${config.keycloak.authority}`,
    );
  }

  client = jwksClient({
    jwksUri: `${config.keycloak.authority}/protocol/openid-connect/certs`,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });

  return client;
};

export const getSigningKey = (
  header: jwt.JwtHeader,
  callback: jwt.SigningKeyCallback,
): void => {
  getClient().getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);

    callback(null, key?.getPublicKey());
  });
};
