using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Analytics.Queries.GetSuiteBreakdown;

public record GetSuiteBreakdownQuery
    : IRequest<IReadOnlyList<SuiteBreakdown>>,
        IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
}

public class GetSuiteBreakdownQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetSuiteBreakdownQuery, IReadOnlyList<SuiteBreakdown>>
{
    public async Task<IReadOnlyList<SuiteBreakdown>> Handle(
        GetSuiteBreakdownQuery request,
        CancellationToken cancellationToken
    )
    {
        return await context
            .TestResults.Where(r => r.TestRunId == request.RunId && !r.IsDeleted)
            .Join(
                context.TestCases.Where(tc => !tc.IsDeleted),
                r => r.TestCaseId,
                tc => tc.Id,
                (r, tc) => new { r.Status, tc.SuiteId }
            )
            .Join(
                context.TestSuites.Where(s => !s.IsDeleted),
                x => x.SuiteId,
                s => s.Id,
                (x, s) => new { x.Status, SuiteName = s.Name }
            )
            .GroupBy(x => x.SuiteName)
            .Select(g => new SuiteBreakdown(
                g.Key,
                g.Count(x => x.Status == TestResultStatus.Passed),
                g.Count(x => x.Status == TestResultStatus.Failed),
                g.Count(x => x.Status == TestResultStatus.Blocked),
                g.Count(x => x.Status == TestResultStatus.Skipped)
            ))
            .ToListAsync(cancellationToken);
    }
}
