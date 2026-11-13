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
    public sealed record Query : IRequest<IReadOnlyList<TrendPoint>>, IProjectScopedRequest
    {
        public ProjectId ProjectId { get; init; }

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
            var countsByRun = statusCounts
                .GroupBy(item => item.TestRunId)
                .ToDictionary(
                    group => group.Key,
                    group =>
                        StatusCounts.From(
                            group.ToDictionary(item => item.Status, item => item.Count)
                        )
                );

            return runs.AsEnumerable()
                .Reverse()
                .Select(run =>
                {
                    var counts = countsByRun.GetValueOrDefault(run.Id);

                    return new TrendPoint
                    {
                        RunId = run.Id,
                        RunName = run.Name,
                        CreatedAt = run.CreatedAt,
                        Total = counts.Total,
                        Passed = counts.Passed,
                        Failed = counts.Failed,
                        Blocked = counts.Blocked,
                        Skipped = counts.Skipped,
                        Untested = counts.Untested,
                        PassRate = counts.PassRate ?? 0,
                        Source = run.Source,
                    };
                })
                .ToList();
        }
    }
}
