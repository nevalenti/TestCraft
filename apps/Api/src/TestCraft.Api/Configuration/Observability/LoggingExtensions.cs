using System.Globalization;

using Serilog;
using Serilog.Debugging;
using Serilog.Enrichers.Span;
using Serilog.Events;
using Serilog.Sinks.Grafana.Loki;
using Serilog.Templates;
using Serilog.Templates.Themes;

using TestCraft.Infrastructure.Auth;

namespace TestCraft.Api.Configuration.Observability;

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
                    .MinimumLevel.Override("Hangfire", LogEventLevel.Warning)
                    .MinimumLevel.Override("MassTransit", LogEventLevel.Warning)
                    .ReadFrom.Configuration(context.Configuration)
                    .Enrich.FromLogContext()
                    .Enrich.WithSpan()
                    .Enrich.WithProperty("environment", environmentName)
                    .WriteTo.Console(
                        new ExpressionTemplate(
                            "{@t:HH:mm:ss} [{@l:u3}] {#if requestId is not null}rid={requestId} {#end}{#if pageId is not null}pid={pageId} {#end}{#if userId is not null}uid={userId} {#end}{@m}\n{@x}",
                            formatProvider: CultureInfo.InvariantCulture,
                            theme: TemplateTheme.Literate
                        )
                    );

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
        if (
            exception is OperationCanceledException
            && httpContext.RequestAborted.IsCancellationRequested
        )
        {
            return LogEventLevel.Debug;
        }

        if (exception is not null)
        {
            return LogEventLevel.Error;
        }

        if (httpContext.Request.Path.Value is "/api/health" or "/api/metrics")
        {
            return LogEventLevel.Verbose;
        }

        if (HttpMethods.IsOptions(httpContext.Request.Method))
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

        var userId = user.GetUserIdOrNull();
        if (userId is not null)
        {
            diagnosticContext.Set("userId", userId);
        }

        var username = user.GetUserName();
        if (username is not null)
        {
            diagnosticContext.Set("username", username);
        }
    }
}
