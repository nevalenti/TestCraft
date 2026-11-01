using MassTransit;
using MediatR;
using TestCraft.Application.Common.Events;
using TestCraft.Application.Features.Notifications.Contracts;
using TestCraft.Domain.Events;

namespace TestCraft.Application.Features.TestRuns;

public sealed class TestRunStatusChangedHandler(IPublishEndpoint publishEndpoint)
    : INotificationHandler<DomainEventNotification<TestRunStatusChangedEvent>>
{
    public Task Handle(
        DomainEventNotification<TestRunStatusChangedEvent> notification,
        CancellationToken cancellationToken
    )
    {
        var domainEvent = notification.DomainEvent;

        return publishEndpoint.Publish(
            new RunStatusChanged(
                domainEvent.RunId,
                domainEvent.ProjectId,
                domainEvent.RunName,
                domainEvent.NewStatus.ToString(),
                domainEvent.OldStatus.ToString()
            ),
            cancellationToken
        );
    }
}
