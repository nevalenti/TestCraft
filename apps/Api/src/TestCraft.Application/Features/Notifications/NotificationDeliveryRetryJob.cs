using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Features.Notifications;

public sealed class NotificationDeliveryRetryJob(INotificationDispatcher dispatcher)
{
    public Task RunAsync(CancellationToken cancellationToken) =>
        dispatcher.RetryPendingDeliveriesAsync(cancellationToken);
}
