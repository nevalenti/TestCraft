namespace TestCraft.Gateway;

public static class GatewayPaths
{
    public const string WellKnownPrefix = "/.well-known";
    public const string AcmeChallengePrefix =
        WellKnownPrefix + "/acme-challenge";
    public const string SeqPrefix = "/seq";
    public const string MetricsPath = "/metrics";
    public const string HealthPath = "/healthz";
}
