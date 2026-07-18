using System.Reflection;
using Microsoft.Extensions.Logging;

namespace TestCraft.Infrastructure.Configuration;

public static partial class ConfigurationLogging
{
    private const string RedactedValue = "<redacted>";
    private const string NotSetValue = "(not set)";

    public static void LogStartupConfiguration(this ILogger logger, params object[] configurations)
    {
        foreach (var configuration in configurations)
        {
            var type = configuration.GetType();
            foreach (
                var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            )
            {
                var isSensitive = property.GetCustomAttribute<SensitiveAttribute>() is not null;
                var value = Format(property.GetValue(configuration), isSensitive);

                LogConfigurationValue(logger, type.Name, property.Name, value);
            }
        }
    }

    private static string Format(object? value, bool isSensitive)
    {
        if (IsEmpty(value))
        {
            return NotSetValue;
        }

        if (isSensitive)
        {
            return RedactedValue;
        }

        return value switch
        {
            string[] values => string.Join(", ", values),
            _ => value?.ToString() ?? NotSetValue,
        };
    }

    private static bool IsEmpty(object? value) =>
        value switch
        {
            null => true,
            string s => string.IsNullOrEmpty(s),
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
}
