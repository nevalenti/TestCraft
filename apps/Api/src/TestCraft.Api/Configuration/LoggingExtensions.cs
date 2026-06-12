using System.Globalization;
using System.Security.Claims;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Json;
using Serilog.Sinks.Grafana.Loki;

namespace TestCraft.Api.Configuration;

public static class LoggingExtensions
{
    public static WebApplicationBuilder AddSerilogLogging(
        this WebApplicationBuilder builder,
        ApiOptions apiOptions
    )
    {
        builder.Host.UseSerilog(
            (_, _, loggerConfig) =>
            {
                loggerConfig
                    .MinimumLevel.Information()
                    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
                    .Enrich.FromLogContext()
                    .Enrich.With<PinoLevelEnricher>()
                    .WriteTo.Console(new JsonFormatter());

                if (!string.IsNullOrEmpty(apiOptions.LokiUrl))
                {
                    loggerConfig.WriteTo.GrafanaLoki(
                        apiOptions.LokiUrl,
                        labels: [new LokiLabel { Key = "app", Value = apiOptions.OtelServiceName }],
                        handleLogLevelAsLabel: false,
                        propertiesAsLabels: ["level"]
                    );
                }

                if (!string.IsNullOrEmpty(apiOptions.SeqUrl))
                {
                    loggerConfig.WriteTo.Seq(
                        apiOptions.SeqUrl,
                        apiKey: apiOptions.SeqApiKey,
                        formatProvider: CultureInfo.InvariantCulture
                    );
                }
            }
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

        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (userId is not null)
        {
            diagnosticContext.Set("userId", userId);
        }

        var username =
            user.FindFirstValue("preferred_username") ?? user.FindFirstValue(ClaimTypes.Name);
        if (username is not null)
        {
            diagnosticContext.Set("username", username);
        }
    }
}
