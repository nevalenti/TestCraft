using System.ComponentModel.DataAnnotations;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration;

public sealed class ApiOptions
{
    [Required]
    public string KeycloakAuthority { get; init; } = string.Empty;

    public string? KeycloakIssuer { get; init; }

    public string KeycloakAudience { get; init; } = "testcraft-web";

    public bool KeycloakRequireHttpsMetadata { get; init; } = true;

    public string[] CorsAllowedOrigins { get; init; } = [];

    public string? LokiUrl { get; init; }

    public string OtelServiceName { get; init; } = "testcraft-api";

    public string? SeqUrl { get; init; }

    [Sensitive]
    public string? SeqApiKey { get; init; }

    public bool ApplyMigrations { get; init; }

    [Sensitive]
    public string? MetricsToken { get; init; }

    public string? SwaggerBasicAuthUsername { get; init; }

    [Sensitive]
    public string? SwaggerBasicAuthPassword { get; init; }

    public static ApiOptions Bind(IConfiguration configuration)
    {
        var options = new ApiOptions
        {
            KeycloakAuthority = configuration["KEYCLOAK_AUTHORITY"] ?? string.Empty,
            KeycloakIssuer = configuration["KEYCLOAK_ISSUER"],
            KeycloakAudience = configuration["KEYCLOAK_AUDIENCE"] ?? "testcraft-web",
            KeycloakRequireHttpsMetadata = configuration.GetValue(
                "KEYCLOAK_REQUIRE_HTTPS_METADATA",
                defaultValue: true
            ),
            CorsAllowedOrigins = (configuration["CORS_ALLOWED_ORIGINS"] ?? string.Empty).Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
            ),
            LokiUrl = configuration["LOKI_URL"],
            OtelServiceName = configuration["OTEL_SERVICE_NAME"] ?? "testcraft-api",
            SeqUrl = configuration["SEQ_URL"],
            SeqApiKey = configuration["SEQ_API_KEY"],
            ApplyMigrations = configuration.GetValue<bool>("APPLY_MIGRATIONS"),
            MetricsToken = configuration["METRICS_TOKEN"],
            SwaggerBasicAuthUsername = configuration["SWAGGER_BASIC_AUTH_USERNAME"],
            SwaggerBasicAuthPassword = configuration["SWAGGER_BASIC_AUTH_PASSWORD"],
        };

        var results = new List<ValidationResult>();
        if (
            !Validator.TryValidateObject(
                options,
                new ValidationContext(options),
                results,
                validateAllProperties: true
            )
        )
        {
            throw new InvalidOperationException(
                $"Invalid API configuration: {string.Join("; ", results.Select(r => r.ErrorMessage))}"
            );
        }

        return options;
    }
}
