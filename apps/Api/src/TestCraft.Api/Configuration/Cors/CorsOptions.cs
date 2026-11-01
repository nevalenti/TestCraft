using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Cors;

public sealed class CorsOptions : IStartupOptions
{
    [NotSensitive]
    [ConfigurationKeyName("CORS_ALLOWED_ORIGINS")]
    public string CorsAllowedOrigins { get; set; } = string.Empty;

    [NotSensitive]
    public string[] AllowedOrigins =>
        CorsAllowedOrigins.Split(
            ',',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
        );
}
