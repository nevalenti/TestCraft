using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Analytics;

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
                .TestResults.Where(result =>
                    result.TestRunId == request.RunId
                    && result.TestRun!.ProjectId == request.ProjectId
                )
                .Join(
                    context.TestCases,
                    result => result.TestCaseId,
                    testCase => testCase.Id,
                    (result, testCase) => new { result.Status, testCase.SuiteId }
                )
                .Join(
                    context.TestSuites,
                    resultSuiteId => resultSuiteId.SuiteId,
                    suite => suite.Id,
                    (resultSuiteId, suite) => new { resultSuiteId.Status, SuiteName = suite.Name }
                )
                .GroupBy(resultSuiteName => resultSuiteName.SuiteName)
                .Select(group => new SuiteBreakdown
                {
                    SuiteName = group.Key,
                    Passed = group.Count(resultSuiteName =>
                        resultSuiteName.Status == TestResultStatus.Passed
                    ),
                    Failed = group.Count(resultSuiteName =>
                        resultSuiteName.Status == TestResultStatus.Failed
                    ),
                    Blocked = group.Count(resultSuiteName =>
                        resultSuiteName.Status == TestResultStatus.Blocked
                    ),
                    Skipped = group.Count(resultSuiteName =>
                        resultSuiteName.Status == TestResultStatus.Skipped
                    ),
                })
                .ToListAsync(cancellationToken);
    }
}
