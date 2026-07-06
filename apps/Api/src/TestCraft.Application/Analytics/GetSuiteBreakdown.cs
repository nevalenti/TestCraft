using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Analytics;

/// <summary>Result counts for a single suite within a run.</summary>
public record SuiteBreakdown
{
    /// <summary>The suite's name.</summary>
    public required string SuiteName { get; init; }

    /// <summary>Number of passed results in the suite.</summary>
    public required int Passed { get; init; }

    /// <summary>Number of failed results in the suite.</summary>
    public required int Failed { get; init; }

    /// <summary>Number of blocked results in the suite.</summary>
    public required int Blocked { get; init; }

    /// <summary>Number of skipped results in the suite.</summary>
    public required int Skipped { get; init; }
}

public static class GetSuiteBreakdown
{
    /// <summary>Requests a per-suite result breakdown for a run.</summary>
    public sealed record Query : IRequest<IReadOnlyList<SuiteBreakdown>>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The run to break down by suite.</summary>
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
                .TestResults.Where(r =>
                    r.TestRunId == request.RunId && r.TestRun!.ProjectId == request.ProjectId
                )
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
                .Select(g => new SuiteBreakdown
                {
                    SuiteName = g.Key,
                    Passed = g.Count(x => x.Status == TestResultStatus.Passed),
                    Failed = g.Count(x => x.Status == TestResultStatus.Failed),
                    Blocked = g.Count(x => x.Status == TestResultStatus.Blocked),
                    Skipped = g.Count(x => x.Status == TestResultStatus.Skipped),
                })
                .ToListAsync(cancellationToken);
    }
}
