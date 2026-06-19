using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Configuration;

namespace TestCraft.Infrastructure.Configuration;

public sealed class InfrastructureOptions
{
    [Required]
    public string DatabaseUrl { get; init; } = string.Empty;

    public string? RedisUrl { get; init; }

    public string? RabbitMqUrl { get; init; }

    public string MinioEndpoint { get; init; } = "localhost:9000";
    public string MinioAccessKey { get; init; } = string.Empty;
    public string MinioSecretKey { get; init; } = string.Empty;
    public string MinioBucket { get; init; } = "testcraft";
    public bool MinioUseSsl { get; init; }

    public string? SmtpHost { get; init; }
    public int SmtpPort { get; init; } = 587;
    public string? SmtpUser { get; init; }
    public string? SmtpPassword { get; init; }
    public string SmtpFromAddress { get; init; } = "noreply@testcraft.local";

    public static InfrastructureOptions Bind(IConfiguration configuration)
    {
        var options = new InfrastructureOptions
        {
            DatabaseUrl = configuration["DATABASE_URL"] ?? string.Empty,
            RedisUrl = configuration["REDIS_URL"],
            RabbitMqUrl = configuration["RABBITMQ_URL"],
            MinioEndpoint = configuration["MINIO_ENDPOINT"] ?? "localhost:9000",
            MinioAccessKey = configuration["MINIO_ACCESS_KEY"] ?? string.Empty,
            MinioSecretKey = configuration["MINIO_SECRET_KEY"] ?? string.Empty,
            MinioBucket = configuration["MINIO_BUCKET"] ?? "testcraft",
            MinioUseSsl = bool.TryParse(configuration["MINIO_USE_SSL"], out var ssl) && ssl,
            SmtpHost = configuration["SMTP_HOST"],
            SmtpPort = int.TryParse(configuration["SMTP_PORT"], out var port) ? port : 587,
            SmtpUser = configuration["SMTP_USER"],
            SmtpPassword = configuration["SMTP_PASSWORD"],
            SmtpFromAddress = configuration["SMTP_FROM_ADDRESS"] ?? "noreply@testcraft.local",
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
