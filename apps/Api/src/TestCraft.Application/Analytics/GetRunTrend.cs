using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Analytics;

public record TrendPoint(
    Guid RunId,
    string RunName,
    DateTimeOffset CreatedAt,
    int Total,
    int Passed,
    int Failed,
    int Blocked,
    int Skipped,
    double PassRate
);

public static class GetRunTrend
{
    public sealed record Query : IRequest<IReadOnlyList<TrendPoint>>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
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

                    return new TrendPoint(
                        r.Id,
                        r.Name,
                        r.CreatedAt,
                        total,
                        r.Passed,
                        r.Failed,
                        r.Blocked,
                        r.Skipped,
                        passRate
                    );
                })
                .ToList();
        }
    }
}
