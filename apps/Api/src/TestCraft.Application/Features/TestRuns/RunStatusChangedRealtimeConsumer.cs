using MassTransit;
using TestCraft.Application.Common.Caching;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.Notifications.Contracts;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestRuns;

public sealed class RunStatusChangedRealtimeConsumer(ICacheService cache, ITestRunNotifier notifier)
    : IConsumer<RunStatusChanged>
{
    public async Task Consume(ConsumeContext<RunStatusChanged> context)
    {
        var message = context.Message;
        var cancellationToken = context.CancellationToken;

        await cache.RemoveAsync(CacheKeys.TestRunResponse(message.RunId), cancellationToken);
        await notifier.RunStatusChangedAsync(
            message.RunId,
            Enum.Parse<TestRunStatus>(message.NewStatus),
            cancellationToken
        );
        await notifier.DashboardChangedAsync(message.ProjectId, message.RunId, cancellationToken);
    }
}
