namespace TestCraft.Gateway.Configuration;

public sealed class GatewayMetricsOptions
{
    [ConfigurationKeyName("METRICS_TOKEN")]
    public string? MetricsToken { get; set; }
}
