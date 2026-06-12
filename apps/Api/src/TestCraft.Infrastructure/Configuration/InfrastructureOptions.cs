using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Configuration;

namespace TestCraft.Infrastructure.Configuration;

public sealed class InfrastructureOptions
{
    [Required]
    public string DatabaseUrl { get; init; } = string.Empty;

    public string? RedisUrl { get; init; }

    public string? RabbitMqUrl { get; init; }

    public static InfrastructureOptions Bind(IConfiguration configuration)
    {
        var options = new InfrastructureOptions
        {
            DatabaseUrl = configuration["DATABASE_URL"] ?? string.Empty,
            RedisUrl = configuration["REDIS_URL"],
            RabbitMqUrl = configuration["RABBITMQ_URL"],
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
