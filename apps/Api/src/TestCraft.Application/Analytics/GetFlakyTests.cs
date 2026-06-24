using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Analytics;

public record FlakyTestStat(
    Guid TestCaseId,
    string TestCaseName,
    int TotalRuns,
    int PassCount,
    int FailCount,
    double FlakRate
);

public static class GetFlakyTests
{
    public sealed record Query : IRequest<IReadOnlyList<FlakyTestStat>>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
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
                .TestResults.Where(r =>
                    r.TestRun != null && r.TestRun.ProjectId == request.ProjectId
                )
                .GroupBy(r => new { r.TestCaseId, TestCaseName = r.TestCase!.Name })
                .Where(g =>
                    g.Count() >= request.MinRuns
                    && g.Any(r => r.Status == TestResultStatus.Passed)
                    && g.Any(r => r.Status == TestResultStatus.Failed)
                )
                .Select(g => new
                {
                    g.Key.TestCaseId,
                    g.Key.TestCaseName,
                    TotalRuns = g.Count(),
                    PassCount = g.Count(r => r.Status == TestResultStatus.Passed),
                    FailCount = g.Count(r => r.Status == TestResultStatus.Failed),
                })
                .OrderByDescending(s => (double)s.FailCount / s.TotalRuns)
                .ToListAsync(cancellationToken);

            return rows.Select(s => new FlakyTestStat(
                    s.TestCaseId,
                    s.TestCaseName,
                    s.TotalRuns,
                    s.PassCount,
                    s.FailCount,
                    Math.Round((double)s.FailCount / s.TotalRuns * 100, 1)
                ))
                .ToList();
        }
    }
}
