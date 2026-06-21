using MassTransit;
using MediatR;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Notifications.Contracts;
using TestCraft.Domain.Events;

namespace TestCraft.Application.TestRuns;

public sealed class TestRunStatusChangedHandler(
    ICacheService cache,
    IPublishEndpoint publishEndpoint
) : INotificationHandler<TestRunStatusChangedEvent>
{
    public async Task Handle(
        TestRunStatusChangedEvent notification,
        CancellationToken cancellationToken
    )
    {
        await cache.RemoveAsync(CacheKeys.TestRunResponse(notification.RunId), cancellationToken);

        await publishEndpoint.Publish(
            new RunStatusChanged(
                notification.RunId,
                notification.ProjectId,
                notification.RunName,
                notification.NewStatus.ToString(),
                notification.OldStatus.ToString()
            ),
            cancellationToken
        );
    }
}
