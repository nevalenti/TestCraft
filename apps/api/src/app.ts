import express, { type Express, json } from "express";

import docsRoutes from "@/presentation/docs/docs.routes";
import { cors } from "@/presentation/middleware/cors.middleware";
import { errorHandler } from "@/presentation/middleware/error-handler.middleware";
import { helmet } from "@/presentation/middleware/helmet.middleware";
import { httpLogger } from "@/presentation/middleware/http-logger.middleware";
import { httpMetrics } from "@/presentation/middleware/http-metrics.middleware";
import { rateLimiter } from "@/presentation/middleware/rate-limit.middleware";
import { requestId } from "@/presentation/middleware/request-id.middleware";
import systemRoutes from "@/presentation/routes/system.routes";
import v1Routes from "@/presentation/routes/v1";

const app: Express = express();

app.set("trust proxy", 1);

app.use(requestId);
app.use(helmet);
app.use(httpLogger);
app.use(httpMetrics);
app.use("/api/v1/projects/:projectId/import", json({ limit: "5mb" }));
app.use(json({ limit: "100kb" }));
app.use(cors);

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

app.use(errorHandler);

export default app;
