using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Analytics;

/// <summary>Pass-rate snapshot for a single run, used to plot a project's trend over time.</summary>
public record TrendPoint
{
    /// <summary>The run's identifier.</summary>
    public required TestRunId RunId { get; init; }

    /// <summary>The run's display name.</summary>
    public required string RunName { get; init; }

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

    /// <summary>The run's source, e.g. the CI system that reported it.</summary>
    public string? Source { get; init; }
}

public static class GetRunTrend
{
    /// <summary>Requests the run trend for a project.</summary>
    public sealed record Query : IRequest<IReadOnlyList<TrendPoint>>, IProjectScopedRequest
    {
        /// <summary>The project to report on.</summary>
        public ProjectId ProjectId { get; init; }

        /// <summary>Maximum number of most recent runs to include.</summary>
        public int Limit { get; init; } = 20;
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<TrendPoint>>
    {
        public async Task<IReadOnlyList<TrendPoint>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var runs = await context
                .TestRuns.Where(testRun => testRun.ProjectId == request.ProjectId)
                .OrderByDescending(testRun => testRun.CreatedAt)
                .Take(request.Limit)
                .Select(testRun => new
                {
                    testRun.Id,
                    testRun.Name,
                    testRun.CreatedAt,
                    testRun.Source,
                })
                .ToListAsync(cancellationToken);

            var runIds = runs.Select(run => run.Id).ToArray();
            if (runIds.Length == 0)
            {
                return [];
            }

            var statusCounts = await context
                .TestResults.Where(result => runIds.Contains(result.TestRunId))
                .CurrentOutcomes()
                .GroupBy(result => new { result.TestRunId, result.Status })
                .Select(group => new
                {
                    group.Key.TestRunId,
                    group.Key.Status,
                    Count = group.Count(),
                })
                .ToListAsync(cancellationToken);
            var counts = statusCounts.ToDictionary(
                item => (item.TestRunId, item.Status),
                item => item.Count
            );

            return runs.AsEnumerable()
                .Reverse()
                .Select(run =>
                {
                    var passed = counts.GetValueOrDefault((run.Id, TestResultStatus.Passed));
                    var failed = counts.GetValueOrDefault((run.Id, TestResultStatus.Failed));
                    var blocked = counts.GetValueOrDefault((run.Id, TestResultStatus.Blocked));
                    var skipped = counts.GetValueOrDefault((run.Id, TestResultStatus.Skipped));
                    var untested = counts.GetValueOrDefault((run.Id, TestResultStatus.Untested));
                    var executed = passed + failed + blocked + skipped;
                    var total = executed + untested;
                    var passRate =
                        executed > 0 ? Math.Round((double)passed / executed * 100, 1) : 0.0;

                    return new TrendPoint
                    {
                        RunId = run.Id,
                        RunName = run.Name,
                        CreatedAt = run.CreatedAt,
                        Total = total,
                        Passed = passed,
                        Failed = failed,
                        Blocked = blocked,
                        Skipped = skipped,
                        Untested = untested,
                        PassRate = passRate,
                        Source = run.Source,
                    };
                })
                .ToList();
        }
    }
}
