using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.ShareTokens;

/// <summary>A run's results, as exposed via a public share link.</summary>
public record SharedRunResponse
{
    /// <summary>The run's display name.</summary>
    public required string RunName { get; init; }

    /// <summary>The environment the run was executed against.</summary>
    public required string Environment { get; init; }

    /// <summary>The run's status.</summary>
    public required TestRunStatus Status { get; init; }

    /// <summary>When the run was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>Number of test cases with a current outcome in the run.</summary>
    public required int Total { get; init; }

    /// <summary>Number of passed results.</summary>
    public required int Passed { get; init; }

    /// <summary>Number of failed results.</summary>
    public required int Failed { get; init; }

    /// <summary>Number of blocked results.</summary>
    public required int Blocked { get; init; }

    /// <summary>Number of skipped results.</summary>
    public required int Skipped { get; init; }

    /// <summary>Number of planned cases awaiting execution.</summary>
    public required int Untested { get; init; }

    /// <summary>Percentage of results that passed.</summary>
    public required double PassRate { get; init; }

    /// <summary>The run's individual test results.</summary>
    public required IReadOnlyList<SharedResultItem> Results { get; init; }

    /// <summary>Total number of current outcomes across all pages.</summary>
    public required int ResultsTotal { get; init; }

    /// <summary>Current page number, starting at one.</summary>
    public required int Page { get; init; }

    /// <summary>Maximum number of results in a page.</summary>
    public required int PageSize { get; init; }
}

/// <summary>A single test result within a publicly shared run.</summary>
public record SharedResultItem
{
    /// <summary>The test case's name.</summary>
    public required string TestCaseName { get; init; }

    /// <summary>The result's status.</summary>
    public required TestResultStatus Status { get; init; }

    /// <summary>Free-form notes, e.g. a failure message.</summary>
    public string? Notes { get; init; }

    /// <summary>How long the test took to execute, in milliseconds.</summary>
    public long? DurationMs { get; init; }

    /// <summary>When the result was recorded.</summary>
    public required DateTimeOffset? ExecutedAt { get; init; }
}

public static class GetRunByShareToken
{
    /// <summary>Requests a run's results by its public share token.</summary>
    public sealed record Query(string Token, int Page = 1, int PageSize = 50)
        : IRequest<SharedRunResponse>;

    public sealed class Validator : AbstractValidator<Query>
    {
        public Validator()
        {
            RuleFor(query => query.Page).InclusiveBetween(1, 10_000);
            RuleFor(query => query.PageSize).InclusiveBetween(1, 500);
            RuleFor(query => query)
                .Must(query => (query.Page - 1) * query.PageSize <= 100_000)
                .WithMessage("Pages beyond the first 100,000 results are unavailable");
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        IApiTokenHasher hasher,
        TimeProvider timeProvider
    ) : IRequestHandler<Query, SharedRunResponse>
    {
        public async Task<SharedRunResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var tokenHash = hasher.Hash(request.Token);
            var shareToken = await context
                .ShareTokens.AsNoTracking()
                .FirstOrDefaultAsync(st => st.TokenHash == tokenHash, cancellationToken);

            if (
                shareToken is null
                || (
                    shareToken.ExpiresAt.HasValue && shareToken.ExpiresAt < timeProvider.GetUtcNow()
                )
            )
            {
                throw new NotFoundException();
            }

            var run =
                await context
                    .TestRuns.AsNoTracking()
                    .FirstOrDefaultAsync(
                        testRun => testRun.Id == shareToken.TestRunId,
                        cancellationToken
                    )
                ?? throw new NotFoundException();

            var resultsQuery = context
                .TestResults.Where(result => result.TestRunId == run.Id)
                .CurrentOutcomes();
            var statusCounts = await resultsQuery
                .GroupBy(result => result.Status)
                .Select(group => new { Status = group.Key, Count = group.Count() })
                .ToListAsync(cancellationToken);

            var counts = statusCounts.ToDictionary(count => count.Status, count => count.Count);
            var passed = counts.GetValueOrDefault(TestResultStatus.Passed);
            var failed = counts.GetValueOrDefault(TestResultStatus.Failed);
            var blocked = counts.GetValueOrDefault(TestResultStatus.Blocked);
            var skipped = counts.GetValueOrDefault(TestResultStatus.Skipped);
            var untested = counts.GetValueOrDefault(TestResultStatus.Untested);
            var executed = passed + failed + blocked + skipped;
            var total = executed + untested;
            var passRate = executed > 0 ? Math.Round(passed * 100.0 / executed, 1) : 0;

            var results = await resultsQuery
                .OrderBy(result => result.CreatedAt)
                .ThenBy(result => result.Id)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(result => new SharedResultItem
                {
                    TestCaseName = result.TestCase!.Name,
                    Status = result.Status,
                    Notes = result.Notes,
                    DurationMs = result.DurationMs,
                    ExecutedAt = result.ExecutedAt,
                })
                .ToListAsync(cancellationToken);

            return new SharedRunResponse
            {
                RunName = run.Name,
                Environment = run.Environment,
                Status = run.Status,
                CreatedAt = run.CreatedAt,
                Total = total,
                Passed = passed,
                Failed = failed,
                Blocked = blocked,
                Skipped = skipped,
                Untested = untested,
                PassRate = passRate,
                Results = results,
                ResultsTotal = total,
                Page = request.Page,
                PageSize = request.PageSize,
            };
        }
    }
}
