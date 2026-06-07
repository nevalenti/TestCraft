import compression from "compression";
import express, { type Express, json } from "express";

import docsRoutes from "@/api/docs/docs.routes";
import { cors } from "@/api/middleware/cors.middleware";
import { errorHandler } from "@/api/middleware/error-handler.middleware";
import { helmet } from "@/api/middleware/helmet.middleware";
import { httpLogger } from "@/api/middleware/http-logger.middleware";
import { httpMetrics } from "@/api/middleware/http-metrics.middleware";
import { rateLimiter } from "@/api/middleware/rate-limit.middleware";
import { requestId } from "@/api/middleware/request-id.middleware";
import systemRoutes from "@/api/routes/system.routes";
import v1Routes from "@/api/routes/v1";
import { NotFoundError } from "@/domain/errors";

const app: Express = express();

app.set("trust proxy", 1);

app.use(requestId);
app.use(cors);
app.use(compression());
app.use(helmet);
app.use(httpLogger);
app.use(httpMetrics);
app.use("/api/v1/projects/:projectId/import", json({ limit: "5mb" }));
app.use(json({ limit: "100kb" }));

app.use(systemRoutes);
app.use("/api/v1/docs", docsRoutes);

app.use(
  "/api/v1",
  rateLimiter,
  (_req, res, next) => {
    res.setHeader("X-API-Version", "1");
    next();
  },
  v1Routes,
);

app.use((_req, _res, next) => next(new NotFoundError()));
app.use(errorHandler);

export default app;
