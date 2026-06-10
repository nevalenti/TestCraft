import { trace } from "@opentelemetry/api";
import type { Request } from "express";
import { pinoHttp } from "pino-http";

import { logger } from "@/infrastructure/logging/logger";

export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === "/health" || req.url === "/metrics",
  },
  mixin(req) {
    const result: Record<string, unknown> = {};

    const span = trace.getActiveSpan();

    if (span?.isRecording()) {
      const { traceId, spanId } = span.spanContext();

      result.traceId = traceId;
      result.spanId = spanId;
    }

    const expressReq = req as Request;

    if (expressReq.route) {
      result.route = `${expressReq.baseUrl}${expressReq.route.path}`;
    }

    return result;
  },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
