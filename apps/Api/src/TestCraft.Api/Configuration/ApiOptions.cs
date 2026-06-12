using System.ComponentModel.DataAnnotations;

namespace TestCraft.Api.Configuration;

public sealed class ApiOptions
{
    [Required]
    public string KeycloakAuthority { get; init; } = string.Empty;

    public string KeycloakAudience { get; init; } = "testcraft-web";

    public bool KeycloakRequireHttpsMetadata { get; init; } = true;

    public string[] CorsAllowedOrigins { get; init; } = [];

    public string? LokiUrl { get; init; }

    public string OtelServiceName { get; init; } = "testcraft-api";

    public string? SeqUrl { get; init; }

    public string? SeqApiKey { get; init; }

    public bool ApplyMigrations { get; init; }

    public static ApiOptions Bind(IConfiguration configuration)
    {
        var options = new ApiOptions
        {
            KeycloakAuthority = configuration["KEYCLOAK_AUTHORITY"] ?? string.Empty,
            KeycloakAudience = configuration["KEYCLOAK_AUDIENCE"] ?? "testcraft-web",
            KeycloakRequireHttpsMetadata =
                configuration["KEYCLOAK_REQUIRE_HTTPS_METADATA"] != "false",
            CorsAllowedOrigins = (configuration["CORS_ALLOWED_ORIGINS"] ?? string.Empty).Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
            ),
            LokiUrl = configuration["LOKI_URL"],
            OtelServiceName = configuration["OTEL_SERVICE_NAME"] ?? "testcraft-api",
            SeqUrl = configuration["SEQ_URL"],
            SeqApiKey = configuration["SEQ_API_KEY"],
            ApplyMigrations = configuration.GetValue<bool>("APPLY_MIGRATIONS"),
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
