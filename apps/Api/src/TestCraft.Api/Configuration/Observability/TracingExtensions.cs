using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace TestCraft.Api.Configuration.Observability;

public static class TracingExtensions
{
    public static WebApplicationBuilder AddOpenTelemetryTracing(
        this WebApplicationBuilder builder,
        ApiLoggingOptions loggingOptions
    )
    {
        if (string.IsNullOrEmpty(loggingOptions.OtelExporterEndpoint))
        {
            return builder;
        }

        builder
            .Services.AddOpenTelemetry()
            .ConfigureResource(resource => resource.AddService(loggingOptions.OtelServiceName))
            .WithTracing(tracing =>
                tracing
                    .AddAspNetCoreInstrumentation(options =>
                        options.Filter = context =>
                            context.Request.Path.Value is not ("/api/health" or "/api/metrics")
                    )
                    .AddHttpClientInstrumentation()
                    .AddOtlpExporter(otlp =>
                        otlp.Endpoint = new Uri(loggingOptions.OtelExporterEndpoint)
                    )
            );

        return builder;
    }
}
