namespace TestCraft.Application.Caching;

public static class CacheKeys
{
    public static string TestRunResponse(TestRunId runId) => $"testcraft:testrun:summary:{runId}";
}
