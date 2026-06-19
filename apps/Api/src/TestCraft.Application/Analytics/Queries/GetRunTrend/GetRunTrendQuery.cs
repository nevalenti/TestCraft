using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Analytics.Queries.GetRunTrend;

public record GetRunTrendQuery : IRequest<IReadOnlyList<TrendPoint>>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public int Limit { get; init; } = 20;
}

public class GetRunTrendQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetRunTrendQuery, IReadOnlyList<TrendPoint>>
{
    public async Task<IReadOnlyList<TrendPoint>> Handle(
        GetRunTrendQuery request,
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
                Passed = r.TestResults.Count(tr =>
                    tr.Status == TestResultStatus.Passed && !tr.IsDeleted
                ),
                Failed = r.TestResults.Count(tr =>
                    tr.Status == TestResultStatus.Failed && !tr.IsDeleted
                ),
                Blocked = r.TestResults.Count(tr =>
                    tr.Status == TestResultStatus.Blocked && !tr.IsDeleted
                ),
                Skipped = r.TestResults.Count(tr =>
                    tr.Status == TestResultStatus.Skipped && !tr.IsDeleted
                ),
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
