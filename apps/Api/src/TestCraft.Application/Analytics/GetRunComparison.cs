using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Analytics;

public record RunComparison(string RunAName, string RunBName, IReadOnlyList<ComparisonRow> Results);

public record ComparisonRow(
    Guid TestCaseId,
    string TestCaseName,
    string? StatusInA,
    string? StatusInB,
    bool IsRegression,
    bool IsFix
);

public static class GetRunComparison
{
    public sealed record Query : IRequest<RunComparison>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid RunAId { get; init; }
        public required Guid RunBId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, RunComparison>
    {
        public async Task<RunComparison> Handle(Query request, CancellationToken cancellationToken)
        {
            var runA =
                await context.TestRuns.FirstOrDefaultAsync(
                    r => r.Id == request.RunAId && r.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException("Run A not found");

            var runB =
                await context.TestRuns.FirstOrDefaultAsync(
                    r => r.Id == request.RunBId && r.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException("Run B not found");

            var resultsA = await context
                .TestResults.Where(r => r.TestRunId == request.RunAId)
                .Select(r => new { r.TestCaseId, r.Status })
                .ToListAsync(cancellationToken);

            var resultsB = await context
                .TestResults.Where(r => r.TestRunId == request.RunBId)
                .Select(r => new { r.TestCaseId, r.Status })
                .ToListAsync(cancellationToken);

            // Use last result per test case in case a run has multiple entries for the same case.
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

                    return new ComparisonRow(
                        caseId,
                        caseName ?? caseId.ToString(),
                        mapA.ContainsKey(caseId) ? statusA.ToString() : null,
                        mapB.ContainsKey(caseId) ? statusB.ToString() : null,
                        isRegression,
                        isFix
                    );
                })
                .OrderBy(r => r.TestCaseName)
                .ToList();

            return new RunComparison(runA.Name, runB.Name, rows);
        }
    }
}
