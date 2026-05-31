import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";

import { config } from "@/infrastructure/config";

let sdk: NodeSDK | undefined;

if (config.telemetry.otlpEndpoint) {
  sdk = new NodeSDK({
    serviceName: config.telemetry.serviceName,
    traceExporter: new OTLPTraceExporter({
      url: `${config.telemetry.otlpEndpoint}/v1/traces`,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();
}

export const shutdownTracing = () => sdk?.shutdown();
