using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Analytics;

/// <summary>Pass/fail signal for a test case that has flipped status across recent runs.</summary>
public record FlakyTestStat
{
    /// <summary>The test case's identifier.</summary>
    public required TestCaseId TestCaseId { get; init; }

    /// <summary>The test case's name.</summary>
    public required string TestCaseName { get; init; }

    /// <summary>Total number of qualifying runs considered.</summary>
    public required int TotalRuns { get; init; }

    /// <summary>Number of passing results among those runs.</summary>
    public required int PassCount { get; init; }

    /// <summary>Number of failing results among those runs.</summary>
    public required int FailCount { get; init; }

    /// <summary>Percentage of runs that failed.</summary>
    public required double FlakRate { get; init; }
}

public static class GetFlakyTests
{
    /// <summary>Requests flaky test detection for a project.</summary>
    public sealed record Query : IRequest<IReadOnlyList<FlakyTestStat>>, IProjectScopedRequest
    {
        /// <summary>The project to scan.</summary>
        public ProjectId ProjectId { get; init; }

        /// <summary>Minimum number of runs a test must have to be considered.</summary>
        public int MinRuns { get; init; } = 3;
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<FlakyTestStat>>
    {
        public async Task<IReadOnlyList<FlakyTestStat>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var rows = await context
                .TestResults.Where(testResult =>
                    testResult.TestRun != null && testResult.TestRun.ProjectId == request.ProjectId
                )
                .GroupBy(testResult => new
                {
                    testResult.TestCaseId,
                    TestCaseName = testResult.TestCase!.Name,
                })
                .Where(group =>
                    group.Count() >= request.MinRuns
                    && group.Any(result => result.Status == TestResultStatus.Passed)
                    && group.Any(result => result.Status == TestResultStatus.Failed)
                )
                .Select(group => new
                {
                    group.Key.TestCaseId,
                    group.Key.TestCaseName,
                    TotalRuns = group.Count(),
                    PassCount = group.Count(result => result.Status == TestResultStatus.Passed),
                    FailCount = group.Count(result => result.Status == TestResultStatus.Failed),
                })
                .OrderByDescending(stat => (double)stat.FailCount / stat.TotalRuns)
                .ToListAsync(cancellationToken);

            return rows.Select(row => new FlakyTestStat
                {
                    TestCaseId = row.TestCaseId,
                    TestCaseName = row.TestCaseName,
                    TotalRuns = row.TotalRuns,
                    PassCount = row.PassCount,
                    FailCount = row.FailCount,
                    FlakRate = Math.Round((double)row.FailCount / row.TotalRuns * 100, 1),
                })
                .ToList();
        }
    }
}
