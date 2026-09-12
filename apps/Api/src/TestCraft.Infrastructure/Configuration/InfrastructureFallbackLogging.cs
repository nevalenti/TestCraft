using Microsoft.Extensions.Logging;

namespace TestCraft.Infrastructure.Configuration;

public static partial class InfrastructureFallbackLogging
{
    extension(ILogger logger)
    {
        public void LogInfrastructureFallbacks(InfrastructureOptions options)
        {
            if (!options.IsRedisConfigured)
            {
                LogDegradedProvider(
                    logger,
                    "Redis",
                    "in-process no-op cache (no cross-instance caching)"
                );
            }

            if (!options.IsRabbitMqConfigured)
            {
                LogDegradedProvider(
                    logger,
                    "RabbitMQ",
                    "in-memory message bus (no durability, single-instance only)"
                );
            }

            if (!options.IsMinioConfigured)
            {
                LogDegradedProvider(
                    logger,
                    "Minio",
                    "unconfigured storage service (uploads and downloads will fail)"
                );
            }

            if (!options.IsSmtpConfigured)
            {
                LogDegradedProvider(
                    logger,
                    "SMTP",
                    "no-op email service (emails will not be sent)"
                );
            }
        }
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "{Provider} is not configured — falling back to {Fallback}"
    )]
    private static partial void LogDegradedProvider(
        ILogger logger,
        string provider,
        string fallback
    );
}
