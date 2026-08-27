using Prometheus;

using TestCraft.Common.Security;
using TestCraft.Gateway;

namespace TestCraft.Gateway.Configuration;

public static class MetricsExtensions
{
    public static WebApplication MapGatewayMetrics(
        this WebApplication app,
        GatewayMetricsOptions metricsOptions
    )
    {
        app.MapGet(
            GatewayPaths.MetricsPath,
            async context =>
            {
                var metricsToken = metricsOptions.MetricsToken;
                if (
                    !string.IsNullOrEmpty(metricsToken)
                    && !IsBearerTokenValid(
                        context.Request.Headers.Authorization.ToString(),
                        metricsToken
                    )
                )
                {
                    context.Response.StatusCode =
                        StatusCodes.Status401Unauthorized;
                    return;
                }

                context.Response.ContentType =
                    "text/plain; version=0.0.4; charset=utf-8";
                await Metrics.DefaultRegistry.CollectAndExportAsTextAsync(
                    context.Response.Body,
                    context.RequestAborted
                );
            }
        );

        return app;
    }

    private static bool IsBearerTokenValid(string? authHeader, string token) =>
        FixedTimeCredentialComparer.Equals(
            authHeader ?? string.Empty,
            $"Bearer {token}"
        );
}
