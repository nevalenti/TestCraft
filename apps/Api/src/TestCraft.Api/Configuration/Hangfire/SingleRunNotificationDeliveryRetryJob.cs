using Hangfire;
using TestCraft.Application.Features.Notifications;

namespace TestCraft.Api.Configuration.Hangfire;

public sealed class SingleRunNotificationDeliveryRetryJob(NotificationDeliveryRetryJob job)
{
    [DisableConcurrentExecution(timeoutInSeconds: 300)]
    public Task RunAsync(CancellationToken cancellationToken) => job.RunAsync(cancellationToken);
}