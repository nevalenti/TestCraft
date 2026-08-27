using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

using TestCraft.Gateway;

namespace TestCraft.Gateway.Configuration;

public static class GatewayTracingExtensions
{
    public static WebApplicationBuilder AddOpenTelemetryTracing(
        this WebApplicationBuilder builder,
        GatewayLoggingOptions loggingOptions
    )
    {
        if (string.IsNullOrEmpty(loggingOptions.OtelExporterEndpoint))
        {
            return builder;
        }

        builder
            .Services.AddOpenTelemetry()
            .ConfigureResource(resource =>
                resource.AddService(loggingOptions.ServiceName)
            )
            .WithTracing(tracing =>
                tracing
                    .AddAspNetCoreInstrumentation(options =>
                        options.Filter = context =>
                            context.Request.Path.Value
                                is not GatewayPaths.MetricsPath
                    )
                    .AddHttpClientInstrumentation()
                    .AddOtlpExporter(otlp =>
                        otlp.Endpoint = new Uri(
                            loggingOptions.OtelExporterEndpoint
                        )
                    )
            );

        return builder;
    }
}
