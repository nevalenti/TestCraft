using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration;

public sealed class MetricsOptions : IStartupOptions
{
    [Sensitive]
    public string? MetricsToken { get; init; }

    public static MetricsOptions Bind(IConfiguration configuration) =>
        OptionsValidator.ValidateAndThrow(
            new MetricsOptions { MetricsToken = configuration["METRICS_TOKEN"] },
            "metrics"
        );
}
