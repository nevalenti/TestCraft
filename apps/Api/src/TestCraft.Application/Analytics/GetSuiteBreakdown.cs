using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Analytics;

public record SuiteBreakdown(string SuiteName, int Passed, int Failed, int Blocked, int Skipped);

public static class GetSuiteBreakdown
{
    public sealed record Query : IRequest<IReadOnlyList<SuiteBreakdown>>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid RunId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<SuiteBreakdown>>
    {
        public async Task<IReadOnlyList<SuiteBreakdown>> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .TestResults.Where(r => r.TestRunId == request.RunId)
                .Join(
                    context.TestCases,
                    r => r.TestCaseId,
                    tc => tc.Id,
                    (r, tc) => new { r.Status, tc.SuiteId }
                )
                .Join(
                    context.TestSuites,
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
