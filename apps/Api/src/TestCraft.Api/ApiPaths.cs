namespace TestCraft.Api;

public static class ApiPaths
{
    public const string V1Prefix = "/api/v1";
    public const string DocsPrefix = "/api/docs";

    public static bool IsVersionedApi(PathString path) => path.StartsWithSegments(V1Prefix);
}
