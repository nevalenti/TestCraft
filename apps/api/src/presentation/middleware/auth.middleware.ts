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

export const authenticate: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json(notAuthorized);
    return;
  }

  jwt.verify(
    authHeader.slice(7),
    getSigningKey,
    { audience: config.keycloak.audience, algorithms: ["RS256"] },
    (err, decoded) => {
      (async () => {
        if (err) {
          logger.warn({ err: err.message }, "JWT verification failed");
          res.status(401).json(notAuthorized);
          return;
        }

        const payload = decoded as jwt.JwtPayload;

        req.user = { id: payload.sub! };
        req.log = req.log.child({ UserId: req.user.id });

        next();
      })().catch(next);
    },
  );
};
