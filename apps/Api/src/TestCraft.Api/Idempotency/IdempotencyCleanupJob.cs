using Microsoft.EntityFrameworkCore;
using TestCraft.Persistence;

namespace TestCraft.Api.Idempotency;

public sealed class IdempotencyCleanupJob(AppDbContext dbContext, TimeProvider timeProvider)
{
    public Task RunAsync(CancellationToken cancellationToken)
    {
        var cutoff = timeProvider.GetUtcNow().AddHours(-48);
        return dbContext
            .IdempotencyRecords.Where(record => record.CreatedAt < cutoff)
            .ExecuteDeleteAsync(cancellationToken);
    }
}
