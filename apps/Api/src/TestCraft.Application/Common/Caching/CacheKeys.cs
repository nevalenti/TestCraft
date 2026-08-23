namespace TestCraft.Application.Common.Caching;

public static class CacheKeys
{
    public static string TestRunResponse(TestRunId runId) => $"testcraft:testrun:summary:{runId}";
}
