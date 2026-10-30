using Serilog;
using Serilog.Debugging;
using Serilog.Enrichers.Span;
using Serilog.Events;
using Serilog.Sinks.Grafana.Loki;

namespace TestCraft.Gateway.Configuration;

public static class SerilogLoggingExtensions
{
    public static WebApplicationBuilder AddSerilogLogging(
        this WebApplicationBuilder builder,
        GatewayLoggingOptions loggingOptions
    )
    {
        var environmentName = builder.Environment.EnvironmentName;

        SelfLog.Enable(Console.Error);

        builder.Host.UseSerilog(
            (context, _, loggerConfig) =>
            {
                loggerConfig
                    .MinimumLevel.Information()
                    .MinimumLevel.Override(
                        "Microsoft.AspNetCore",
                        LogEventLevel.Warning
                    )
                    .ReadFrom.Configuration(context.Configuration)
                    .Enrich.FromLogContext()
                    .Enrich.WithProperty("environment", environmentName)
                    .Enrich.WithProperty("release", loggingOptions.Release);

                if (!builder.Environment.IsDevelopment())
                {
                    loggerConfig.Enrich.WithSpan();
                }

                if (!string.IsNullOrEmpty(loggingOptions.LokiUrl))
                {
                    loggerConfig.WriteTo.GrafanaLoki(
                        loggingOptions.LokiUrl,
                        labels:
                        [
                            new LokiLabel
                            {
                                Key = "service_name",
                                Value = loggingOptions.ServiceName,
                            },
                            new LokiLabel
                            {
                                Key = "environment",
                                Value = environmentName,
                            },
                        ],
                        handleLogLevelAsLabel: true
                    );
                }
            },
            writeToProviders: true
        );

        return builder;
    }

    public static WebApplication UseRequestLogging(this WebApplication app)
    {
        app.UseSerilogRequestLogging(options =>
            options.GetLevel = GetRequestLogLevel
        );

        return app;
    }

    private static LogEventLevel GetRequestLogLevel(
        HttpContext httpContext,
        double elapsedMilliseconds,
        Exception? exception
    )
    {
        if (exception is not null)
        {
            return LogEventLevel.Error;
        }

        return httpContext.Response.StatusCode switch
        {
            >= 500 => LogEventLevel.Error,
            401 or 403 => LogEventLevel.Warning,
            _ => LogEventLevel.Information,
        };
    }
}
