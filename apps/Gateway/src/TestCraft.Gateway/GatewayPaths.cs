namespace TestCraft.Gateway;

public static class GatewayPaths
{
    public const string WellKnownPrefix = "/.well-known";
    public const string AcmeChallengePrefix =
        WellKnownPrefix + "/acme-challenge";
    public const string SeqPrefix = "/seq";
}
