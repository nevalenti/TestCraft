using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Configuration;

namespace TestCraft.Infrastructure.Configuration;

public sealed class InfrastructureOptions
{
    [Required]
    [Sensitive]
    public string DatabaseUrl { get; init; } = string.Empty;

    [Sensitive]
    public string? RedisUrl { get; init; }

    [Sensitive]
    public string? RabbitMqUrl { get; init; }

    public string MinioEndpoint { get; init; } = "localhost:9000";
    public string MinioPublicEndpoint { get; init; } = string.Empty;

    [Sensitive]
    public string MinioAccessKey { get; init; } = string.Empty;

    [Sensitive]
    public string MinioSecretKey { get; init; } = string.Empty;
    public string MinioBucket { get; init; } = "testcraft";
    public bool MinioUseSsl { get; init; }

    public string? SmtpHost { get; init; }
    public int SmtpPort { get; init; } = 587;
    public string? SmtpUser { get; init; }

    [Sensitive]
    public string? SmtpPassword { get; init; }
    public string SmtpFromAddress { get; init; } = "noreply@testcraft.local";

    public string KeycloakBaseUrl { get; init; } = string.Empty;
    public string KeycloakRealm { get; init; } = "testcraft";
    public string KeycloakAdminUsername { get; init; } = string.Empty;

    [Sensitive]
    public string KeycloakAdminPassword { get; init; } = string.Empty;

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
            KeycloakBaseUrl = realmIndex >= 0 ? authority[..realmIndex] : authority,
            KeycloakRealm =
                realmIndex >= 0 ? authority[(realmIndex + realmMarker.Length)..] : "testcraft",
            KeycloakAdminUsername = configuration["KEYCLOAK_ADMIN"] ?? string.Empty,
            KeycloakAdminPassword = configuration["KEYCLOAK_ADMIN_PASSWORD"] ?? string.Empty,
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
                $"Invalid infrastructure configuration: {string.Join("; ", results.Select(r => r.ErrorMessage))}"
            );
        }

        return options;
    }
}
