using MassTransit;
using MediatR;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Events;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Notifications.Contracts;
using TestCraft.Domain.Events;

namespace TestCraft.Application.TestRuns;

public sealed class TestRunStatusChangedHandler(
    ICacheService cache,
    IPublishEndpoint publishEndpoint
) : INotificationHandler<DomainEventNotification<TestRunStatusChangedEvent>>
{
    public async Task Handle(
        DomainEventNotification<TestRunStatusChangedEvent> notification,
        CancellationToken cancellationToken
    )
    {
        var domainEvent = notification.DomainEvent;

        await cache.RemoveAsync(CacheKeys.TestRunResponse(domainEvent.RunId), cancellationToken);

        var message = new RunStatusChanged(
            domainEvent.RunId,
            domainEvent.ProjectId,
            domainEvent.RunName,
            domainEvent.NewStatus.ToString(),
            domainEvent.OldStatus.ToString()
        );

        await publishEndpoint.Publish(message, cancellationToken);
    }
}
