using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

public sealed class FailingInsertsInterceptor<TEntity> : SaveChangesInterceptor
    where TEntity : class
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default
    ) =>
        eventData
            .Context!.ChangeTracker.Entries<TEntity>()
            .Any(entry => entry.State == EntityState.Added)
            ? throw new DbUpdateException($"Simulated failure inserting {typeof(TEntity).Name}")
            : ValueTask.FromResult(result);
}
