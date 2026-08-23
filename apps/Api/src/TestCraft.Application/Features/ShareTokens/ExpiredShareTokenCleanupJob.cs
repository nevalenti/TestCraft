using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Features.ShareTokens;

/// <summary>Recurring Hangfire job that deletes share tokens past their expiry.</summary>
public sealed partial class ExpiredShareTokenCleanupJob(
    IApplicationDbContext context,
    ILogger<ExpiredShareTokenCleanupJob> logger
)
{
    public async Task RunAsync(CancellationToken cancellationToken)
    {
        var deleted = await context
            .ShareTokens.Where(token =>
                token.ExpiresAt != null && token.ExpiresAt < DateTimeOffset.UtcNow
            )
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted > 0)
        {
            LogDeleted(logger, deleted);
        }
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Deleted {Count} expired share tokens")]
    private static partial void LogDeleted(ILogger logger, int count);
}
