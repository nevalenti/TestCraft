using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Notifications;

public sealed partial class NotificationDeliveryCleanupJob(
    IApplicationDbContext context,
    ILogger<NotificationDeliveryCleanupJob> logger
)
{
    private static readonly TimeSpan RetentionPeriod = TimeSpan.FromDays(30);

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        var cutoff = DateTimeOffset.UtcNow - RetentionPeriod;

        var deleted = await context
            .NotificationDeliveries.Where(delivery =>
                delivery.Status != NotificationDeliveryStatus.Pending && delivery.UpdatedAt < cutoff
            )
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted > 0)
        {
            LogDeleted(logger, deleted);
        }
    }

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Deleted {Count} old notification deliveries"
    )]
    private static partial void LogDeleted(ILogger logger, int count);
}
