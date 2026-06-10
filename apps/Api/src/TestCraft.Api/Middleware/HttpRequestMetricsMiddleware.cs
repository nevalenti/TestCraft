using System.Diagnostics;
using System.Globalization;
using Microsoft.AspNetCore.Routing;
using Prometheus;

namespace TestCraft.Api.Middleware;

public static class HttpRequestMetricsMiddlewareExtensions
{
    private static readonly Histogram RequestDuration = Metrics.CreateHistogram(
        "http_request_duration_seconds",
        "HTTP request duration in seconds",
        new HistogramConfiguration
        {
            LabelNames = ["method", "route", "status_code"],
            Buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
        }
    );

    private static readonly Counter RequestsTotal = Metrics.CreateCounter(
        "http_requests_total",
        "Total HTTP requests",
        new CounterConfiguration
        {
            LabelNames = ["method", "route", "status_code"],
        }
    );

    public static IApplicationBuilder UseHttpRequestMetrics(
        this IApplicationBuilder app
    ) =>
        app.Use(
            async (context, next) =>
            {
                var stopwatch = Stopwatch.StartNew();

                await next();

                stopwatch.Stop();

                var route = context.GetEndpoint() is RouteEndpoint endpoint
                    ? $"/{endpoint.RoutePattern.RawText?.TrimStart('/')}"
                    : context.Request.Path.Value ?? "/";

                var labels = new[]
                {
                    context.Request.Method,
                    route,
                    context.Response.StatusCode.ToString(
                        CultureInfo.InvariantCulture
                    ),
                };

                RequestDuration
                    .WithLabels(labels)
                    .Observe(stopwatch.Elapsed.TotalSeconds);
                RequestsTotal.WithLabels(labels).Inc();
            }
        );
}
