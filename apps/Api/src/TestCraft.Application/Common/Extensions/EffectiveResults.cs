using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Common.Extensions;

public static class EffectiveResults
{
    public static IQueryable<TestResult> CurrentOutcomes(this IQueryable<TestResult> results) =>
        results.Where(result =>
            result.Id
            == results
                .Where(candidate =>
                    candidate.TestRunId == result.TestRunId
                    && candidate.TestCaseId == result.TestCaseId
                )
                .OrderByDescending(candidate => candidate.Status != TestResultStatus.Untested)
                .ThenByDescending(candidate => candidate.ExecutedAt)
                .ThenByDescending(candidate => candidate.CreatedAt)
                .ThenByDescending(candidate => candidate.Id)
                .Select(candidate => candidate.Id)
                .First()
        );
}
