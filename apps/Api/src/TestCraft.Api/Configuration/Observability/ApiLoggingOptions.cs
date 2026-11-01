using System.ComponentModel.DataAnnotations;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Observability;

public sealed class ApiLoggingOptions : IStartupOptions
{
    [NotSensitive]
    [ConfigurationKeyName("LOKI_URL")]
    public string? LokiUrl { get; set; }

    [NotSensitive]
    [ConfigurationKeyName("OTEL_SERVICE_NAME")]
    public string OtelServiceName { get; set; } = "testcraft-api";

    [NotSensitive]
    [ConfigurationKeyName("OTEL_EXPORTER_OTLP_ENDPOINT")]
    public string? OtelExporterEndpoint { get; set; }

    public static ApiLoggingOptions Bind(IConfiguration configuration) =>
        OptionsValidator.ValidateAndThrow(
            new ApiLoggingOptions
            {
                LokiUrl = configuration["LOKI_URL"],
                OtelServiceName = configuration["OTEL_SERVICE_NAME"] ?? "testcraft-api",
                OtelExporterEndpoint = configuration["OTEL_EXPORTER_OTLP_ENDPOINT"],
            },
            "logging"
        );
}
