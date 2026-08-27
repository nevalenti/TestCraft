namespace TestCraft.Gateway.Configuration;

public sealed class GatewayMetricsOptions
{
    public string? MetricsToken { get; init; }

    public static GatewayMetricsOptions Bind(IConfiguration configuration) =>
        new() { MetricsToken = configuration["METRICS_TOKEN"] };
}
