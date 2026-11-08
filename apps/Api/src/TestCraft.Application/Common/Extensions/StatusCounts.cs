using Microsoft.EntityFrameworkCore;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Common.Extensions;

/// <summary>Result counts per status, with the totals and pass rate derived from them.</summary>
public readonly record struct StatusCounts(
    int Passed,
    int Failed,
    int Blocked,
    int Skipped,
    int Untested
)
{
    public int Executed => Passed + Failed + Blocked + Skipped;

    public int Total => Executed + Untested;

    /// <summary>Percentage of executed results that passed; <c>null</c> when none executed.</summary>
    public double? PassRate => Executed == 0 ? null : Math.Round(Passed * 100.0 / Executed, 1);

    public static StatusCounts From(IReadOnlyDictionary<TestResultStatus, int> counts) =>
        new(
            counts.GetValueOrDefault(TestResultStatus.Passed),
            counts.GetValueOrDefault(TestResultStatus.Failed),
            counts.GetValueOrDefault(TestResultStatus.Blocked),
            counts.GetValueOrDefault(TestResultStatus.Skipped),
            counts.GetValueOrDefault(TestResultStatus.Untested)
        );

    public static async Task<StatusCounts> CountByStatusAsync(
        IQueryable<TestResult> results,
        CancellationToken cancellationToken
    ) =>
        From(
            await results
                .GroupBy(result => result.Status)
                .Select(group => new { Status = group.Key, Count = group.Count() })
                .ToDictionaryAsync(item => item.Status, item => item.Count, cancellationToken)
        );
}
