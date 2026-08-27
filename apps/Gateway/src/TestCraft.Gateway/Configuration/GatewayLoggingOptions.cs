namespace TestCraft.Gateway.Configuration;

public sealed class GatewayLoggingOptions
{
    public string ServiceName { get; init; } = "testcraft-gateway";
    public string? LokiUrl { get; init; }
    public string? SeqUrl { get; init; }
    public string? SeqApiKey { get; init; }
    public string? OtelExporterEndpoint { get; init; }

    public static GatewayLoggingOptions Bind(IConfiguration configuration) =>
        new()
        {
            LokiUrl = configuration["LOKI_URL"],
            SeqUrl = configuration["SEQ_URL"],
            SeqApiKey = configuration["SEQ_API_KEY"],
            OtelExporterEndpoint = configuration["OTEL_EXPORTER_OTLP_ENDPOINT"],
        };
}
