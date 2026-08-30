using System.ComponentModel.DataAnnotations;

using Microsoft.Extensions.Configuration;

namespace TestCraft.Infrastructure.Configuration;

public sealed class InfrastructureOptions : IStartupOptions, IValidatableObject
{
    [Required]
    [Sensitive]
    public string DatabaseUrl { get; init; } = string.Empty;

    [Sensitive]
    public string? RedisUrl { get; init; }

    [Sensitive]
    public string? RabbitMqUrl { get; init; }

    [NotSensitive]
    public string MinioEndpoint { get; init; } = "localhost:9000";

    [NotSensitive]
    public string MinioPublicEndpoint { get; init; } = string.Empty;

    [Sensitive]
    public string MinioAccessKey { get; init; } = string.Empty;

    [Sensitive]
    public string MinioSecretKey { get; init; } = string.Empty;

    [NotSensitive]
    public string MinioBucket { get; init; } = "testcraft";

    [NotSensitive]
    public bool MinioUseSsl { get; init; }

    [NotSensitive]
    public string? SmtpHost { get; init; }

    [NotSensitive]
    public int SmtpPort { get; init; } = 587;

    [NotSensitive]
    public string? SmtpUser { get; init; }

    [Sensitive]
    public string? SmtpPassword { get; init; }

    [NotSensitive]
    public string SmtpFromAddress { get; init; } = "noreply@testcraft.local";

    [NotSensitive]
    public bool NotificationDeliveryRetryEnabled { get; init; } = true;

    [Required]
    [NotSensitive]
    public string KeycloakBaseUrl { get; init; } = string.Empty;

    [NotSensitive]
    public string KeycloakRealm { get; init; } = "testcraft";

    [Required]
    [NotSensitive]
    public string KeycloakAdminClientId { get; init; } = string.Empty;

    [Required]
    [Sensitive]
    public string KeycloakAdminClientSecret { get; init; } = string.Empty;

    public static InfrastructureOptions Bind(IConfiguration configuration)
    {
        var authority = configuration["KEYCLOAK_AUTHORITY"] ?? string.Empty;
        const string realmMarker = "/realms/";
        var realmIndex = authority.IndexOf(realmMarker, StringComparison.Ordinal);

        var options = new InfrastructureOptions
        {
            DatabaseUrl = configuration["DATABASE_URL"] ?? string.Empty,
            RedisUrl = configuration["REDIS_URL"],
            RabbitMqUrl = configuration["RABBITMQ_URL"],
            MinioEndpoint = configuration["MINIO_ENDPOINT"] ?? "localhost:9000",
            MinioPublicEndpoint = configuration["MINIO_PUBLIC_ENDPOINT"] ?? string.Empty,
            MinioAccessKey = configuration["MINIO_ACCESS_KEY"] ?? string.Empty,
            MinioSecretKey = configuration["MINIO_SECRET_KEY"] ?? string.Empty,
            MinioBucket = configuration["MINIO_BUCKET"] ?? "testcraft",
            MinioUseSsl = bool.TryParse(configuration["MINIO_USE_SSL"], out var ssl) && ssl,
            SmtpHost = configuration["SMTP_HOST"],
            SmtpPort = int.TryParse(configuration["SMTP_PORT"], out var port) ? port : 587,
            SmtpUser = configuration["SMTP_USER"],
            SmtpPassword = configuration["SMTP_PASSWORD"],
            SmtpFromAddress = configuration["SMTP_FROM_ADDRESS"] ?? "noreply@testcraft.local",
            NotificationDeliveryRetryEnabled =
                !bool.TryParse(
                    configuration["NOTIFICATION_DELIVERY_RETRY_ENABLED"],
                    out var retryEnabled
                ) || retryEnabled,
            KeycloakBaseUrl = realmIndex >= 0 ? authority[..realmIndex] : authority,
            KeycloakRealm =
                realmIndex >= 0 ? authority[(realmIndex + realmMarker.Length)..] : "testcraft",
            KeycloakAdminClientId = configuration["KEYCLOAK_ADMIN_CLIENT_ID"] ?? string.Empty,
            KeycloakAdminClientSecret =
                configuration["KEYCLOAK_ADMIN_CLIENT_SECRET"] ?? string.Empty,
        };

        return OptionsValidator.ValidateAndThrow(options, "infrastructure");
    }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var hasAccessKey = !string.IsNullOrEmpty(MinioAccessKey);
        var hasSecretKey = !string.IsNullOrEmpty(MinioSecretKey);

        if (hasAccessKey != hasSecretKey)
        {
            yield return new ValidationResult(
                "MinioAccessKey and MinioSecretKey must both be set, or both left unset",
                [nameof(MinioAccessKey), nameof(MinioSecretKey)]
            );
        }
    }
}
