using System.Reflection;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace TestCraft.Infrastructure.Configuration;

public static partial class ConfigurationLogging
{
    private const string RedactedValue = "<redacted>";
    private const string NotSetValue = "(not set)";

    extension(ILogger logger)
    {
        public void LogStartupConfiguration(IServiceProvider services)
        {
            foreach (var configuration in services.GetServices<IStartupOptions>())
            {
                var type = configuration.GetType();
                foreach (
                    var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                )
                {
                    var isSensitive =
                        property.GetCustomAttribute<NotSensitiveAttribute>() is null;
                    var value = Format(property.GetValue(configuration), isSensitive);

                    LogConfigurationValue(logger, type.Name, property.Name, value);
                }
            }
        }

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

    private static string Format(object? value, bool isSensitive)
    {
        if (IsEmpty(value))
        {
            return NotSetValue;
        }

        if (!isSensitive)
        {
            return value switch
            {
                string[] values => string.Join(", ", values),
                _ => value?.ToString() ?? NotSetValue,
            };
        }

        return RedactedValue;
    }

    private static bool IsEmpty(object? value) =>
        value switch
        {
            null => true,
            string stringValue => string.IsNullOrEmpty(stringValue),
            string[] { Length: 0 } => true,
            _ => false,
        };

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Startup configuration {ConfigType}.{ConfigKey} = {ConfigValue}"
    )]
    private static partial void LogConfigurationValue(
        ILogger logger,
        string configType,
        string configKey,
        string configValue
    );

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
