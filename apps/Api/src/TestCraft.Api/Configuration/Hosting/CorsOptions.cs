using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Hosting;

public sealed class CorsOptions : IStartupOptions
{
    public string[] CorsAllowedOrigins { get; init; } = [];

    public static CorsOptions Bind(IConfiguration configuration) =>
        OptionsValidator.ValidateAndThrow(
            new CorsOptions
            {
                CorsAllowedOrigins = (configuration["CORS_ALLOWED_ORIGINS"] ?? string.Empty).Split(
                    ',',
                    StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
                ),
            },
            "CORS"
        );
}
