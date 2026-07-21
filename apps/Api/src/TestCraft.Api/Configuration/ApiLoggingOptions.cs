using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration;

public sealed class ApiLoggingOptions
{
    public string? LokiUrl { get; init; }

    public string OtelServiceName { get; init; } = "testcraft-api";

    public string? SeqUrl { get; init; }

    [Sensitive]
    public string? SeqApiKey { get; init; }

    public static ApiLoggingOptions Bind(IConfiguration configuration) =>
        OptionsValidator.ValidateAndThrow(
            new ApiLoggingOptions
            {
                LokiUrl = configuration["LOKI_URL"],
                OtelServiceName = configuration["OTEL_SERVICE_NAME"] ?? "testcraft-api",
                SeqUrl = configuration["SEQ_URL"],
                SeqApiKey = configuration["SEQ_API_KEY"],
            },
            "logging"
        );
}
