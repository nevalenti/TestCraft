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
        ) =>
            await context
                .TestResults.Where(r =>
                    !r.IsDeleted && r.TestRun != null && r.TestRun.ProjectId == request.ProjectId
                )
                .GroupBy(r => new { r.TestCaseId, r.TestCase!.Name })
                .Where(g =>
                    g.Count() >= request.MinRuns
                    && g.Any(r => r.Status == TestResultStatus.Passed)
                    && g.Any(r => r.Status == TestResultStatus.Failed)
                )
                .Select(g => new FlakyTestStat(
                    g.Key.TestCaseId,
                    g.Key.Name,
                    g.Count(),
                    g.Count(r => r.Status == TestResultStatus.Passed),
                    g.Count(r => r.Status == TestResultStatus.Failed),
                    Math.Round(
                        (double)g.Count(r => r.Status == TestResultStatus.Failed) / g.Count() * 100,
                        1
                    )
                ))
                .OrderByDescending(s => s.FlakRate)
                .ToListAsync(cancellationToken);
    }
}
