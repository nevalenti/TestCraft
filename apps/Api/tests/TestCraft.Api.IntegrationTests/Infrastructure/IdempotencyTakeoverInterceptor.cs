using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using TestCraft.Domain.Entities;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

public sealed class IdempotencyTakeoverInterceptor(string key) : SaveChangesInterceptor
{
    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default
    )
    {
        var context = eventData.Context!;
        if (context.ChangeTracker.Entries<TestRun>().Any(entry => entry.State == EntityState.Added))
        {
            await context.Database.ExecuteSqlAsync(
                $"""
                UPDATE idempotency_records
                SET request_hash = 'takeover', created_at = created_at + interval '1 second'
                WHERE key = {key}
                """,
                cancellationToken
            );
        }

        return result;
    }
}
