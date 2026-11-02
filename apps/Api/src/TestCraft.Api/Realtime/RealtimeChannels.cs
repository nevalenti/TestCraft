using StackExchange.Redis;

namespace TestCraft.Api.Realtime;

public static class RealtimeChannels
{
    private const int DashboardShards = 64;

    public static readonly RedisChannel AllRuns = RedisChannel.Pattern("run:*:events");

    public static readonly RedisChannel AllDashboards = RedisChannel.Pattern("dashboard:*:events");

    public static RedisChannel Run(TestRunId runId) =>
        RedisChannel.Literal($"run:{runId.Value}:events");

    public static RedisChannel Dashboard(ProjectId projectId) =>
        RedisChannel.Literal($"dashboard:{Shard(projectId)}:events");

    public static TestRunId? RunOf(string channel) =>
        channel.Split(':') is ["run", var id, "events"] && Guid.TryParse(id, out var value)
            ? TestRunId.From(value)
            : null;

    private static int Shard(ProjectId projectId) =>
        projectId.Value.ToByteArray(bigEndian: true)[15] % DashboardShards;
}
