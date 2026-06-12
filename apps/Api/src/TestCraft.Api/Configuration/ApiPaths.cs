namespace TestCraft.Api.Configuration;

public static class ApiPaths
{
    public const string V1Prefix = "/api/v1";
    public const string DocsPrefix = "/api/v1/docs";

    public static bool IsVersionedApi(PathString path) =>
        path.StartsWithSegments(V1Prefix) && !path.StartsWithSegments(DocsPrefix);
}
