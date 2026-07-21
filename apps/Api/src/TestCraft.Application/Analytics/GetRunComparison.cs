using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Analytics;

/// <summary>Per-test-case comparison between two runs.</summary>
public record RunComparison
{
    /// <summary>The baseline run's name.</summary>
    public required string RunAName { get; init; }

    /// <summary>The comparison run's name.</summary>
    public required string RunBName { get; init; }

    /// <summary>Per-test-case comparison rows.</summary>
    public required IReadOnlyList<ComparisonRow> Results { get; init; }
}

/// <summary>Status of a single test case across the two compared runs.</summary>
public record ComparisonRow
{
    /// <summary>The test case's identifier.</summary>
    public required Guid TestCaseId { get; init; }

    /// <summary>The test case's name.</summary>
    public required string TestCaseName { get; init; }

    /// <summary>The result status in run A, if the test case was executed there.</summary>
    public string? StatusInA { get; init; }

    /// <summary>The result status in run B, if the test case was executed there.</summary>
    public string? StatusInB { get; init; }

    /// <summary>Whether the test case passed in run A but failed in run B.</summary>
    public required bool IsRegression { get; init; }

    /// <summary>Whether the test case failed in run A but passed in run B.</summary>
    public required bool IsFix { get; init; }
}

public static class GetRunComparison
{
    /// <summary>Requests a comparison between two runs in a project.</summary>
    public sealed record Query : IRequest<RunComparison>, IProjectScopedRequest
    {
        /// <summary>The project both runs belong to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The baseline run.</summary>
        public required Guid RunAId { get; init; }

        /// <summary>The run being compared against the baseline.</summary>
        public required Guid RunBId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, RunComparison>
    {
        public async Task<RunComparison> Handle(Query request, CancellationToken cancellationToken)
        {
            var runA =
                await context
                    .TestRuns.AsNoTracking()
                    .FirstOrDefaultAsync(
                        r => r.Id == request.RunAId && r.ProjectId == request.ProjectId,
                        cancellationToken
                    )
                ?? throw new NotFoundException("Run A not found");

            var runB =
                await context
                    .TestRuns.AsNoTracking()
                    .FirstOrDefaultAsync(
                        r => r.Id == request.RunBId && r.ProjectId == request.ProjectId,
                        cancellationToken
                    )
                ?? throw new NotFoundException("Run B not found");

            var resultsA = await context
                .TestResults.Where(r => r.TestRunId == request.RunAId)
                .Select(r => new { r.TestCaseId, r.Status })
                .ToListAsync(cancellationToken);

            var resultsB = await context
                .TestResults.Where(r => r.TestRunId == request.RunBId)
                .Select(r => new { r.TestCaseId, r.Status })
                .ToListAsync(cancellationToken);

            var mapA = resultsA
                .GroupBy(r => r.TestCaseId)
                .ToDictionary(g => g.Key, g => g.Last().Status);
            var mapB = resultsB
                .GroupBy(r => r.TestCaseId)
                .ToDictionary(g => g.Key, g => g.Last().Status);

            var allCaseIds = mapA.Keys.Union(mapB.Keys).ToList();

            var caseNames = await context
                .TestCases.Where(tc => allCaseIds.Contains(tc.Id))
                .Select(tc => new { tc.Id, tc.Name })
                .ToDictionaryAsync(tc => tc.Id, tc => tc.Name, cancellationToken);

            var rows = allCaseIds
                .Select(caseId =>
                {
                    mapA.TryGetValue(caseId, out var statusA);
                    mapB.TryGetValue(caseId, out var statusB);
                    caseNames.TryGetValue(caseId, out var caseName);

                    var isRegression =
                        statusA == TestResultStatus.Passed && statusB == TestResultStatus.Failed;
                    var isFix =
                        statusA == TestResultStatus.Failed && statusB == TestResultStatus.Passed;

                    return new ComparisonRow
                    {
                        TestCaseId = caseId,
                        TestCaseName = caseName ?? caseId.ToString(),
                        StatusInA = mapA.ContainsKey(caseId) ? statusA.ToString() : null,
                        StatusInB = mapB.ContainsKey(caseId) ? statusB.ToString() : null,
                        IsRegression = isRegression,
                        IsFix = isFix,
                    };
                })
                .OrderBy(r => r.TestCaseName)
                .ToList();

            return new RunComparison
            {
                RunAName = runA.Name,
                RunBName = runB.Name,
                Results = rows,
            };
        }
    }
}
