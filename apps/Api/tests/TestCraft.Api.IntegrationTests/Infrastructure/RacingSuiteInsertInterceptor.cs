using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Domain.Entities;
using TestCraft.Persistence;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

/// <summary>
/// Once, right before a suite with the given name is inserted, commits the same suite from another
/// context, so the insert hits the unique index the way two concurrent imports would.
/// </summary>
public sealed class RacingSuiteInsertInterceptor(string suiteName, Func<IServiceProvider> services)
    : SaveChangesInterceptor
{
    private int _raced;

    public bool Raced => _raced == 1;

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default
    )
    {
        var suite = eventData
            .Context!.ChangeTracker.Entries<TestSuite>()
            .Where(entry => entry.State == EntityState.Added)
            .Select(entry => entry.Entity)
            .FirstOrDefault(added => added.Name == suiteName);

        if (suite is not null && Interlocked.Exchange(ref _raced, 1) == 0)
        {
            using var scope = services().CreateScope();
            var other = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            other.TestSuites.Add(TestSuite.Create(suite.ProjectId, suite.Name));
            await other.SaveChangesAsync(cancellationToken);
        }

        return result;
    }
}
