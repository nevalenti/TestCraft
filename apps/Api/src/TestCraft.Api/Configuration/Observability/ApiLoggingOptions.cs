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

    [NotSensitive]
    [ConfigurationKeyName("RELEASE")]
    public string Release { get; set; } = "dev";

    [NotSensitive]
    [Range(0.0, 1.0)]
    [ConfigurationKeyName("OTEL_TRACES_SAMPLER_ARG")]
    public double TraceSampleRatio { get; set; } = 1.0;

    [Sensitive]
    [ConfigurationKeyName("GLITCHTIP_DSN")]
    public string? GlitchtipDsn { get; set; }

    [NotSensitive]
    [ConfigurationKeyName("LOG_REQUEST_ID")]
    public bool LogRequestId { get; set; } = true;

    [NotSensitive]
    [ConfigurationKeyName("LOG_USER_ID")]
    public bool LogUserId { get; set; } = true;

    [NotSensitive]
    [ConfigurationKeyName("LOG_USERNAME")]
    public bool LogUsername { get; set; }

    [NotSensitive]
    [ConfigurationKeyName("LOG_PAGE_ID")]
    public bool LogPageId { get; set; } = true;

    [NotSensitive]
    [ConfigurationKeyName("LOG_SUCCESSFUL_REQUESTS")]
    public bool? LogSuccessfulRequests { get; set; }

    [NotSensitive]
    public IReadOnlyList<string> ExcludedLogProperties =>
        [
            .. LogRequestId ? [] : new[] { "requestId" },
            .. LogUserId ? [] : new[] { "userId" },
            .. LogUserId && LogUsername ? [] : new[] { "username" },
            .. LogPageId ? [] : new[] { "pageId" },
        ];
}
