using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Analytics;

/// <summary>Pass-rate snapshot for a single run, used to plot a project's trend over time.</summary>
public record TrendPoint
{
    /// <summary>The run's identifier.</summary>
    public required Guid RunId { get; init; }

    /// <summary>The run's display name.</summary>
    public required string RunName { get; init; }

    /// <summary>When the run was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>Total number of results recorded for the run.</summary>
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

    /// <summary>The run's source, e.g. the CI system that reported it.</summary>
    public string? Source { get; init; }
}

public static class GetRunTrend
{
    /// <summary>Requests the run trend for a project.</summary>
    public sealed record Query : IRequest<IReadOnlyList<TrendPoint>>, IProjectScopedRequest
    {
        /// <summary>The project to report on.</summary>
        public Guid ProjectId { get; init; }

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
                .TestRuns.Where(r => r.ProjectId == request.ProjectId)
                .OrderByDescending(r => r.CreatedAt)
                .Take(request.Limit)
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    r.CreatedAt,
                    r.Source,
                    Passed = r.TestResults.Count(tr => tr.Status == TestResultStatus.Passed),
                    Failed = r.TestResults.Count(tr => tr.Status == TestResultStatus.Failed),
                    Blocked = r.TestResults.Count(tr => tr.Status == TestResultStatus.Blocked),
                    Skipped = r.TestResults.Count(tr => tr.Status == TestResultStatus.Skipped),
                })
                .ToListAsync(cancellationToken);

            return runs.AsEnumerable()
                .Reverse()
                .Select(r =>
                {
                    var total = r.Passed + r.Failed + r.Blocked + r.Skipped;
                    var passRate = total > 0 ? Math.Round((double)r.Passed / total * 100, 1) : 0.0;

                    return new TrendPoint
                    {
                        RunId = r.Id,
                        RunName = r.Name,
                        CreatedAt = r.CreatedAt,
                        Total = total,
                        Passed = r.Passed,
                        Failed = r.Failed,
                        Blocked = r.Blocked,
                        Skipped = r.Skipped,
                        PassRate = passRate,
                        Source = r.Source,
                    };
                })
                .ToList();
        }
    }
}
