import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { getSigningKey } from "@/infrastructure/auth/jwks";
import { config } from "@/infrastructure/config";
import { logger } from "@/infrastructure/logging/logger";

const notAuthorized = {
  type: "https://tools.ietf.org/html/rfc7235#section-3.1",
  title: "Unauthorized",
  status: 401,
};

const verifyToken = (token: string): Promise<jwt.JwtPayload> =>
  new Promise((resolve, reject) =>
    jwt.verify(
      token,
      getSigningKey,
      { audience: config.keycloak.audience, algorithms: ["RS256"] },
      (err, decoded) =>
        err ? reject(err) : resolve(decoded as jwt.JwtPayload),
    ),
  );

export const authenticate: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json(notAuthorized);
    return;
  }

  try {
    const payload = await verifyToken(authHeader.slice(7));
    req.user = { id: payload.sub! };
    req.log = req.log.child({ UserId: req.user.id });
    next();
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "JWT verification failed");
    res.status(401).json(notAuthorized);
  }
};
