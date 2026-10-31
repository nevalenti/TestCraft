namespace TestCraft.Api;

public static class ApiPaths
{
    public const string V1Prefix = "/api/v1";
    public const string DocsPrefix = "/api/docs";
    public const string HangfirePrefix = "/hangfire";
    private const string PublicSharePrefix = "/api/v1/share";

    public static bool IsVersionedApi(PathString path) => path.StartsWithSegments(V1Prefix);

    public static bool IsPublicShare(PathString path) => path.StartsWithSegments(PublicSharePrefix);

    public static PathString RedactSecrets(PathString path) =>
        IsPublicShare(path) ? new PathString($"{PublicSharePrefix}/[redacted]") : path;
}
