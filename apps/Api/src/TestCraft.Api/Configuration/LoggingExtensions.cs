using System.Globalization;
using Serilog;
using Serilog.Debugging;
using Serilog.Enrichers.Span;
using Serilog.Events;
using Serilog.Sinks.Grafana.Loki;
using TestCraft.Api.Extensions;

namespace TestCraft.Api.Configuration;

public static class LoggingExtensions
{
    public static WebApplicationBuilder AddSerilogLogging(
        this WebApplicationBuilder builder,
        ApiLoggingOptions loggingOptions
    )
    {
        var environmentName = builder.Environment.EnvironmentName;

        SelfLog.Enable(Console.Error);

        builder.Host.UseSerilog(
            (context, _, loggerConfig) =>
            {
                loggerConfig
                    .MinimumLevel.Information()
                    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
                    .ReadFrom.Configuration(context.Configuration)
                    .Enrich.FromLogContext()
                    .Enrich.WithSpan()
                    .Enrich.WithProperty("environment", environmentName);

                if (!string.IsNullOrEmpty(loggingOptions.LokiUrl))
                {
                    loggerConfig.WriteTo.GrafanaLoki(
                        loggingOptions.LokiUrl,
                        labels:
                        [
                            new LokiLabel { Key = "app", Value = loggingOptions.OtelServiceName },
                            new LokiLabel { Key = "environment", Value = environmentName },
                        ],
                        handleLogLevelAsLabel: true
                    );
                }

                if (!string.IsNullOrEmpty(loggingOptions.SeqUrl))
                {
                    loggerConfig.WriteTo.Seq(
                        loggingOptions.SeqUrl,
                        apiKey: loggingOptions.SeqApiKey,
                        formatProvider: CultureInfo.InvariantCulture
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
        {
            options.GetLevel = GetRequestLogLevel;
            options.EnrichDiagnosticContext = EnrichRequestDiagnosticContext;
        });

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

        if (httpContext.Request.Path.Value is "/api/health" or "/api/metrics")
        {
            return LogEventLevel.Verbose;
        }

        return LogEventLevel.Information;
    }

    private static void EnrichRequestDiagnosticContext(
        IDiagnosticContext diagnosticContext,
        HttpContext httpContext
    )
    {
        diagnosticContext.Set(
            "req",
            new { method = httpContext.Request.Method, url = httpContext.Request.Path.Value },
            destructureObjects: true
        );

        var user = httpContext.User;
        if (user.Identity?.IsAuthenticated != true)
        {
            return;
        }

        var userId = user.GetUserId();
        if (userId is not null)
        {
            diagnosticContext.Set("userId", userId);
        }

        var username = user.GetUsername();
        if (username is not null)
        {
            diagnosticContext.Set("username", username);
        }
    }
}
