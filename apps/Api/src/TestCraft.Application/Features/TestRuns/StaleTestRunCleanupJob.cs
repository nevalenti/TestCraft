using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestRuns;

public sealed partial class StaleTestRunCleanupJob(
    IApplicationDbContext context,
    ILogger<StaleTestRunCleanupJob> logger
)
{
    private static readonly TimeSpan StaleAfter = TimeSpan.FromHours(1);

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        var cutoff = DateTimeOffset.UtcNow - StaleAfter;

        var staleRuns = await context
            .TestRuns.Where(run => run.Status == TestRunStatus.Active && run.CreatedAt < cutoff)
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
