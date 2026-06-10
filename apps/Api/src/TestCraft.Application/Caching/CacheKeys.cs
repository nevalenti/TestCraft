namespace TestCraft.Application.Caching;

public static class CacheKeys
{
    public static string TestRunResponse(Guid runId) =>
        $"testcraft:testrun:summary:{runId}";
}
