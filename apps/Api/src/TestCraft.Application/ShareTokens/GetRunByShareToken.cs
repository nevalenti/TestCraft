using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.ShareTokens;

/// <summary>A run's results, as exposed via a public share link.</summary>
public record SharedRunResponse
{
    /// <summary>The run's display name.</summary>
    public required string RunName { get; init; }

    /// <summary>The environment the run was executed against.</summary>
    public required string Environment { get; init; }

    /// <summary>The run's status.</summary>
    public required string Status { get; init; }

    /// <summary>When the run was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>Total number of results recorded.</summary>
    public required int Total { get; init; }

    /// <summary>Number of passed results.</summary>
    public required int Passed { get; init; }

    /// <summary>Number of failed results.</summary>
    public required int Failed { get; init; }

    /// <summary>Number of blocked results.</summary>
    public required int Blocked { get; init; }

    /// <summary>Number of skipped results.</summary>
    public required int Skipped { get; init; }

    /// <summary>Percentage of results that passed.</summary>
    public required double PassRate { get; init; }

    /// <summary>The run's individual test results.</summary>
    public required IReadOnlyList<SharedResultItem> Results { get; init; }
}

/// <summary>A single test result within a publicly shared run.</summary>
public record SharedResultItem
{
    /// <summary>The test case's name.</summary>
    public required string TestCaseName { get; init; }

    /// <summary>The result's status.</summary>
    public required string Status { get; init; }

    /// <summary>Free-form notes, e.g. a failure message.</summary>
    public string? Notes { get; init; }

    /// <summary>How long the test took to execute, in milliseconds.</summary>
    public long? DurationMs { get; init; }

    /// <summary>When the result was recorded.</summary>
    public required DateTimeOffset ExecutedAt { get; init; }
}

public static class GetRunByShareToken
{
    /// <summary>Requests a run's results by its public share token.</summary>
    public sealed record Query(string Token) : IRequest<SharedRunResponse>;

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, SharedRunResponse>
    {
        public async Task<SharedRunResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var shareToken = await context.ShareTokens.FirstOrDefaultAsync(
                st => st.Token == request.Token,
                cancellationToken
            );

            if (
                shareToken is null
                || (shareToken.ExpiresAt.HasValue && shareToken.ExpiresAt < DateTimeOffset.UtcNow)
            )
            {
                throw new NotFoundException();
            }

            var run =
                await context.TestRuns.FirstOrDefaultAsync(
                    r => r.Id == shareToken.TestRunId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            var results = await context
                .TestResults.Where(r => r.TestRunId == run.Id)
                .Select(r => new SharedResultItem
                {
                    TestCaseName = r.TestCase!.Name,
                    Status = r.Status.ToString(),
                    Notes = r.Notes,
                    DurationMs = r.DurationMs,
                    ExecutedAt = r.ExecutedAt,
                })
                .ToListAsync(cancellationToken);

            var counts = results.GroupBy(r => r.Status).ToDictionary(g => g.Key, g => g.Count());

            var passed = counts.GetValueOrDefault(TestResultStatus.Passed.ToString(), 0);
            var failed = counts.GetValueOrDefault(TestResultStatus.Failed.ToString(), 0);
            var blocked = counts.GetValueOrDefault(TestResultStatus.Blocked.ToString(), 0);
            var skipped = counts.GetValueOrDefault(TestResultStatus.Skipped.ToString(), 0);
            var total = passed + failed + blocked + skipped;
            var passRate = total > 0 ? Math.Round(passed * 100.0 / total, 1) : 0;

            return new SharedRunResponse
            {
                RunName = run.Name,
                Environment = run.Environment,
                Status = run.Status.ToString(),
                CreatedAt = run.CreatedAt,
                Total = total,
                Passed = passed,
                Failed = failed,
                Blocked = blocked,
                Skipped = skipped,
                PassRate = passRate,
                Results = results,
            };
        }
    }
}
