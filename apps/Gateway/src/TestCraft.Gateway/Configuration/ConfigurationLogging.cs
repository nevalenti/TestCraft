namespace TestCraft.Gateway.Configuration;

public static partial class ConfigurationLogging
{
    private const string RedactedValue = "<redacted>";
    private const string NotSetValue = "(not set)";

    private static readonly string[] LoggedSections =
    [
        "AllowedHosts",
        "Kestrel",
        "Logging",
        "ReverseProxy",
    ];

    private static readonly string[] SensitiveKeyMarkers =
    [
        "password",
        "secret",
        "apikey",
        "token",
        "connectionstring",
    ];

    public static void LogStartupConfiguration(
        this ILogger logger,
        IConfiguration configuration
    )
    {
        var relevantPairs = configuration
            .AsEnumerable()
            .Where(pair =>
                LoggedSections.Any(section =>
                    pair.Key.Equals(section, StringComparison.Ordinal)
                    || pair.Key.StartsWith(
                        section + ":",
                        StringComparison.Ordinal
                    )
                )
            )
            .OrderBy(pair => pair.Key, StringComparer.Ordinal);

        foreach (var pair in relevantPairs)
        {
            if (pair.Value is null)
            {
                continue;
            }

            var isSensitive = SensitiveKeyMarkers.Any(marker =>
                pair.Key.Contains(marker, StringComparison.OrdinalIgnoreCase)
            );

            string value;
            if (string.IsNullOrEmpty(pair.Value))
            {
                value = NotSetValue;
            }
            else
            {
                value = isSensitive ? RedactedValue : pair.Value;
            }

            LogConfigurationValue(logger, pair.Key, value);
        }
    }

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Startup configuration {ConfigKey} = {ConfigValue}"
    )]
    private static partial void LogConfigurationValue(
        ILogger logger,
        string configKey,
        string configValue
    );
}
