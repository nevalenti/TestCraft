using System.ComponentModel.DataAnnotations;

namespace TestCraft.Gateway.Configuration;

public sealed class GatewayLoggingOptions
{
    public string ServiceName { get; } = "testcraft-gateway";

    [ConfigurationKeyName("LOKI_URL")]
    public string? LokiUrl { get; set; }

    [ConfigurationKeyName("OTEL_EXPORTER_OTLP_ENDPOINT")]
    public string? OtelExporterEndpoint { get; set; }

    [ConfigurationKeyName("RELEASE")]
    public string Release { get; set; } = "dev";

    [ConfigurationKeyName("OTEL_TRACES_SAMPLER_ARG")]
    [Range(0.0, 1.0)]
    public double TraceSampleRatio { get; set; } = 1.0;
}
