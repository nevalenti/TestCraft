using System.Diagnostics;
using Microsoft.Extensions.Options;

namespace TestCraft.Api.Configuration.Observability;

public static class ErrorTracking
{
    public static WebApplication StartErrorTracking(this WebApplication app)
    {
        var loggingOptions = app.Services.GetRequiredService<IOptions<ApiLoggingOptions>>().Value;
        if (string.IsNullOrEmpty(loggingOptions.GlitchtipDsn))
        {
            return app;
        }

        SentrySdk.Init(options =>
        {
            options.Dsn = loggingOptions.GlitchtipDsn;
            options.Release = loggingOptions.Release;
            options.Environment = app.Environment.EnvironmentName.ToLowerInvariant();
            options.ServerName = loggingOptions.OtelServiceName;
            options.SendDefaultPii = false;
        });
        app.Lifetime.ApplicationStopped.Register(SentrySdk.Close);

        return app;
    }

    public static void Capture(
        Exception exception,
        string requestId,
        string? pageId,
        string? userId
    ) =>
        SentrySdk.CaptureException(
            exception,
            scope =>
            {
                scope.SetTag("request_id", requestId);
                if (pageId is not null)
                {
                    scope.SetTag("page_id", pageId);
                }

                if (Activity.Current is { } activity)
                {
                    scope.SetTag("trace_id", activity.TraceId.ToString());
                }

                if (userId is not null)
                {
                    scope.User = new SentryUser { Id = userId };
                }
            }
        );
}
