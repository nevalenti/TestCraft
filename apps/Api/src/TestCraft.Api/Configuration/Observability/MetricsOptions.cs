using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Observability;

public sealed class MetricsOptions : IStartupOptions
{
    [Sensitive]
    [ConfigurationKeyName("METRICS_TOKEN")]
    public string? MetricsToken { get; set; }
}
