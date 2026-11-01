using System.Text.Json;
using StackExchange.Redis;

namespace TestCraft.Api.Realtime;

public sealed partial class RedisRunEventPublisher(
    IConnectionMultiplexer redis,
    ILogger<RedisRunEventPublisher> logger
) : IRunEventPublisher
{
    public Task PublishRunAsync(TestRunId runId, string message) =>
        PublishAsync(RealtimeChannels.Run(runId), message);

    public Task PublishDashboardAsync(ProjectId projectId, string message) =>
        PublishAsync(RealtimeChannels.Dashboard(projectId), message);

    private async Task PublishAsync(RedisChannel channel, string message)
    {
        try
        {
            await redis.GetSubscriber().PublishAsync(channel, message);
        }
        catch (RedisException exception)
        {
            LogPublishFailed(logger, exception, channel.ToString());
        }
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Could not publish a live update to {Channel}"
    )]
    private static partial void LogPublishFailed(
        ILogger logger,
        Exception exception,
        string channel
    );
}

public sealed partial class RedisRunEventRelay(
    IConnectionMultiplexer redis,
    RunEventBroker broker,
    ILogger<RedisRunEventRelay> logger
) : BackgroundService
{
    private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var subscriber = redis.GetSubscriber();

        while (true)
        {
            try
            {
                (await subscriber.SubscribeAsync(RealtimeChannels.AllRuns)).OnMessage(RelayRun);
                (await subscriber.SubscribeAsync(RealtimeChannels.AllDashboards)).OnMessage(
                    RelayDashboard
                );

                return;
            }
            catch (RedisException exception)
            {
                LogSubscribeFailed(logger, exception);
                await subscriber.UnsubscribeAllAsync(CommandFlags.FireAndForget);
                await Task.Delay(RetryDelay, stoppingToken);
            }
        }
    }

    private void RelayRun(ChannelMessage message)
    {
        if (RealtimeChannels.RunOf(message.Channel.ToString()) is { } runId)
        {
            broker.Publish(runId, message.Message.ToString());
        }
    }

    private void RelayDashboard(ChannelMessage message)
    {
        var json = message.Message.ToString();
        try
        {
            using var document = JsonDocument.Parse(json);
            if (
                document.RootElement.TryGetProperty("data", out var data)
                && data.ValueKind == JsonValueKind.Object
                && data.TryGetProperty("project_id", out var projectId)
                && projectId.TryGetGuid(out var value)
            )
            {
                broker.PublishDashboard(ProjectId.From(value), json);
            }
        }
        catch (JsonException exception)
        {
            LogMalformedMessage(logger, exception, message.Channel.ToString());
        }
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Could not subscribe to live updates in Redis; retrying"
    )]
    private static partial void LogSubscribeFailed(ILogger logger, Exception exception);

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Ignored a malformed live update on {Channel}"
    )]
    private static partial void LogMalformedMessage(
        ILogger logger,
        Exception exception,
        string channel
    );
}
