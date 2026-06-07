import pino from "pino";

import { config } from "@/infrastructure/config";

const isProd = config.nodeEnv === "production";
const level = isProd ? "info" : "debug";

const targets: pino.TransportTargetOptions[] = [];

if (!isProd) {
  targets.push({
    target: "pino-pretty",
    options: { colorize: true, ignore: "pid,hostname" },
    level,
  });
}

if (config.lokiUrl) {
  if (isProd) {
    targets.push({
      target: "pino/file",
      options: { destination: 1 },
      level,
    });
  }
  targets.push({
    target: "pino-loki",
    options: {
      host: config.lokiUrl,
      labels: { app: "testcraft-api", env: config.nodeEnv },
      interval: 5,
      replaceTimestamp: true,
      silenceErrors: true,
    },
    level: "info",
  });
}

const transportTarget = targets.length === 1 ? targets[0] : { targets };
const transport =
  targets.length > 0 ? pino.transport(transportTarget) : undefined;

transport?.on("error", (err: Error) => {
  process.stderr.write(`[pino transport error] ${err.message}\n`);
});

export const logger = transport
  ? pino({ level, timestamp: pino.stdTimeFunctions.isoTime }, transport)
  : pino({ level, timestamp: pino.stdTimeFunctions.isoTime });
