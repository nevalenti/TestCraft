using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestRuns;

public sealed partial class StaleTestRunCleanupJob(
    IApplicationDbContext context,
    ILogger<StaleTestRunCleanupJob> logger,
    TimeProvider timeProvider
)
{
    private static readonly TimeSpan StaleAfter = TimeSpan.FromHours(1);
    private const int BatchSize = 500;

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        var cutoff = timeProvider.GetUtcNow() - StaleAfter;

        var staleRuns = await context
            .TestRuns.Where(run =>
                run.Status == TestRunStatus.Active
                && run.UpdatedAt < cutoff
                && !context
                    .TestResults.IgnoreQueryFilters()
                    .Any(result => result.TestRunId == run.Id && result.UpdatedAt >= cutoff)
                && !context.RunLogs.Any(log => log.RunId == run.Id && log.CreatedAt >= cutoff)
            )
            .OrderBy(run => run.CreatedAt)
            .Take(BatchSize)
            .ToListAsync(cancellationToken);

        if (staleRuns.Count == 0)
        {
            return;
        }

        foreach (var run in staleRuns)
        {
            run.TransitionTo(TestRunStatus.Completed);
        }

        await context.SaveChangesAsync(cancellationToken);

        LogSettled(logger, staleRuns.Count);
    }

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Settled {Count} stale test run(s) stuck in Active"
    )]
    private static partial void LogSettled(ILogger logger, int count);
}
