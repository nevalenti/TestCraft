using System.Globalization;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Json;
using Serilog.Sinks.Grafana.Loki;

namespace TestCraft.Api.Configuration;

public static class LoggingExtensions
{
    public static WebApplicationBuilder AddSerilogLogging(
        this WebApplicationBuilder builder
    )
    {
        builder.Host.UseSerilog(
            (context, _, loggerConfig) =>
            {
                loggerConfig
                    .MinimumLevel.Information()
                    .MinimumLevel.Override(
                        "Microsoft.AspNetCore",
                        LogEventLevel.Warning
                    )
                    .MinimumLevel.Override(
                        "Microsoft.EntityFrameworkCore",
                        LogEventLevel.Warning
                    )
                    .Enrich.FromLogContext()
                    .Enrich.With<PinoLevelEnricher>()
                    .WriteTo.Console(new JsonFormatter());

                var lokiUrl = context.Configuration["LOKI_URL"];
                if (!string.IsNullOrEmpty(lokiUrl))
                {
                    loggerConfig.WriteTo.GrafanaLoki(
                        lokiUrl,
                        labels:
                        [
                            new LokiLabel
                            {
                                Key = "app",
                                Value =
                                    context.Configuration["OTEL_SERVICE_NAME"]
                                    ?? "testcraft-api",
                            },
                        ],
                        handleLogLevelAsLabel: false,
                        propertiesAsLabels: ["level"]
                    );
                }

                var seqUrl = context.Configuration["SEQ_URL"];
                if (!string.IsNullOrEmpty(seqUrl))
                {
                    loggerConfig.WriteTo.Seq(
                        seqUrl,
                        apiKey: context.Configuration["SEQ_API_KEY"],
                        formatProvider: CultureInfo.InvariantCulture
                    );
                }
            }
        );

        return builder;
    }
}
