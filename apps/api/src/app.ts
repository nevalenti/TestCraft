import compression from "compression";
import express, { type Express, json } from "express";

import { apiVersion } from "@/api/middleware/api-version.middleware";
import { cors } from "@/api/middleware/cors.middleware";
import { errorHandler } from "@/api/middleware/error-handler.middleware";
import { helmet } from "@/api/middleware/helmet.middleware";
import { httpLogger } from "@/api/middleware/http-logger.middleware";
import { httpMetrics } from "@/api/middleware/http-metrics.middleware";
import { rateLimiter } from "@/api/middleware/rate-limit.middleware";
import { requestId } from "@/api/middleware/request-id.middleware";
import { requestTimeout } from "@/api/middleware/request-timeout.middleware";
import docsRoutes from "@/api/routes/docs.routes";
import systemRoutes from "@/api/routes/system.routes";
import v1Routes from "@/api/routes/v1";
import { NotFoundError } from "@/domain/errors";

const app: Express = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(requestId);
app.use(cors);
app.use(helmet);
app.use(compression());
app.use(httpLogger);
app.use(httpMetrics);
app.use(json({ limit: "100kb" }));

app.use("/api", systemRoutes);
app.use("/api/v1/docs", docsRoutes);

app.use("/api/v1", apiVersion, rateLimiter, requestTimeout, v1Routes);

app.use((_req, _res, next) => next(new NotFoundError()));
app.use(errorHandler);

export default app;
