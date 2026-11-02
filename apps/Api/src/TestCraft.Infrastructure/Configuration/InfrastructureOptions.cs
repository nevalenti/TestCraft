using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Configuration;

namespace TestCraft.Infrastructure.Configuration;

public sealed class InfrastructureOptions : IStartupOptions, IValidatableObject
{
    private const string RealmMarker = "/realms/";

    [Required]
    [Sensitive]
    [ConfigurationKeyName("DATABASE_URL")]
    public string DatabaseUrl { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    [NotSensitive]
    [ConfigurationKeyName("DB_POOL_TIMEOUT_SECONDS")]
    public int DbPoolTimeoutSeconds { get; set; } = 10;

    [Range(1, int.MaxValue)]
    [NotSensitive]
    [ConfigurationKeyName("DB_STATEMENT_TIMEOUT_MS")]
    public int DbStatementTimeoutMs { get; set; } = 30_000;

    [Sensitive]
    [ConfigurationKeyName("REDIS_URL")]
    public string? RedisUrl { get; set; }

    [Range(0.001, double.MaxValue)]
    [NotSensitive]
    [ConfigurationKeyName("REDIS_TIMEOUT_SECONDS")]
    public double RedisTimeoutSeconds { get; set; } = 2;

    [Sensitive]
    [ConfigurationKeyName("RABBITMQ_URL")]
    public string? RabbitMqUrl { get; set; }

    [NotSensitive]
    [ConfigurationKeyName("MINIO_ENDPOINT")]
    public string MinioEndpoint { get; set; } = "localhost:9000";

    [NotSensitive]
    [ConfigurationKeyName("MINIO_PUBLIC_ENDPOINT")]
    public string MinioPublicEndpoint { get; set; } = string.Empty;

    [Sensitive]
    [ConfigurationKeyName("MINIO_ACCESS_KEY")]
    public string MinioAccessKey { get; set; } = string.Empty;

    [Sensitive]
    [ConfigurationKeyName("MINIO_SECRET_KEY")]
    public string MinioSecretKey { get; set; } = string.Empty;

    [NotSensitive]
    [ConfigurationKeyName("MINIO_BUCKET")]
    public string MinioBucket { get; set; } = "testcraft";

    [NotSensitive]
    [ConfigurationKeyName("MINIO_USE_SSL")]
    public bool MinioUseSsl { get; set; }

    [NotSensitive]
    [ConfigurationKeyName("MINIO_PUBLIC_USE_SSL")]
    public bool? MinioPublicUseSsl { get; set; }

    [NotSensitive]
    [ConfigurationKeyName("SMTP_HOST")]
    public string? SmtpHost { get; set; }

    [Range(1, 65_535)]
    [NotSensitive]
    [ConfigurationKeyName("SMTP_PORT")]
    public int SmtpPort { get; set; } = 587;

    [NotSensitive]
    [ConfigurationKeyName("SMTP_USER")]
    public string? SmtpUser { get; set; }

    [Sensitive]
    [ConfigurationKeyName("SMTP_PASSWORD")]
    public string? SmtpPassword { get; set; }

    [NotSensitive]
    [ConfigurationKeyName("SMTP_FROM_ADDRESS")]
    public string SmtpFromAddress { get; set; } = "noreply@testcraft.local";

    [NotSensitive]
    [ConfigurationKeyName("SMTP_START_TLS")]
    public bool SmtpStartTls { get; set; } = true;

#pragma warning disable S1075
    [NotSensitive]
    [ConfigurationKeyName("WEB_BASE_URL")]
    public string WebBaseUrl { get; set; } = "https://testcraft.pro";
#pragma warning restore S1075

    [NotSensitive]
    [ConfigurationKeyName("NOTIFICATION_DELIVERY_RETRY_ENABLED")]
    public bool NotificationDeliveryRetryEnabled { get; set; } = true;

    [Required]
    [NotSensitive]
    [ConfigurationKeyName("KEYCLOAK_AUTHORITY")]
    public string KeycloakAuthority { get; set; } = string.Empty;

    [NotSensitive]
    public string KeycloakBaseUrl
    {
        get
        {
            var authority = KeycloakAuthority.TrimEnd('/');
            var realmIndex = authority.IndexOf(RealmMarker, StringComparison.Ordinal);
            return realmIndex >= 0 ? authority[..realmIndex] : authority;
        }
    }

    [NotSensitive]
    public string KeycloakRealm
    {
        get
        {
            var authority = KeycloakAuthority.TrimEnd('/');
            var realmIndex = authority.IndexOf(RealmMarker, StringComparison.Ordinal);
            return realmIndex >= 0 ? authority[(realmIndex + RealmMarker.Length)..] : "testcraft";
        }
    }

    [Required]
    [NotSensitive]
    [ConfigurationKeyName("KEYCLOAK_ADMIN_CLIENT_ID")]
    public string KeycloakAdminClientId { get; set; } = string.Empty;

    [Required]
    [Sensitive]
    [ConfigurationKeyName("KEYCLOAK_ADMIN_CLIENT_SECRET")]
    public string KeycloakAdminClientSecret { get; set; } = string.Empty;

    [NotSensitive]
    [ConfigurationKeyName("KEYCLOAK_VERIFY_TLS")]
    public bool KeycloakVerifyTls { get; set; } = true;

    [MemberNotNullWhen(true, nameof(RedisUrl))]
    internal bool IsRedisConfigured => !string.IsNullOrEmpty(RedisUrl);

    [MemberNotNullWhen(true, nameof(RabbitMqUrl))]
    internal bool IsRabbitMqConfigured => !string.IsNullOrEmpty(RabbitMqUrl);

    internal bool IsMinioConfigured =>
        !string.IsNullOrEmpty(MinioAccessKey) && !string.IsNullOrEmpty(MinioSecretKey);

    [MemberNotNullWhen(true, nameof(SmtpHost))]
    internal bool IsSmtpConfigured => !string.IsNullOrEmpty(SmtpHost);

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
