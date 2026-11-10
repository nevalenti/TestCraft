using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Caching;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestResults;

internal static class TestResultRecording
{
    /// <summary>
    /// Records a result for a case in a run, filling the case's untested placeholder when there
    /// is one, then evicts the cached run and notifies realtime subscribers.
    /// </summary>
    public static async Task<TestResultResponse> RecordAsync(
        IApplicationDbContext context,
        ICacheService cache,
        ITestRunNotifier notifier,
        UserId userId,
        ProjectId projectId,
        TestRunId runId,
        TestCaseId testCaseId,
        TestResultStatus status,
        string? notes,
        DefectType? defectType,
        long? durationMs,
        DateTimeOffset executedAt,
        string? defectUrl,
        CancellationToken cancellationToken
    )
    {
        var result = await context.TestResults.FirstOrDefaultAsync(
            existingResult =>
                existingResult.TestRunId == runId
                && existingResult.TestCaseId == testCaseId
                && existingResult.Status == TestResultStatus.Untested,
            cancellationToken
        );
        var replacedPlaceholder = result is not null;
        if (result is not null)
        {
            result.Record(status, notes, defectType, durationMs, executedAt, userId, defectUrl);
        }
        else
        {
            result = TestResult.Create(
                runId,
                testCaseId,
                status,
                notes,
                defectType,
                durationMs,
                executedAt,
                userId,
                defectUrl
            );
            context.TestResults.Add(result);
        }

        await context.SaveChangesAsync(cancellationToken);

        var summary = await context
            .LiveResults()
            .Where(createdResult => createdResult.Id == result.Id)
            .Select(TestResultResponse.Projection)
            .FirstAsync(cancellationToken);

        await cache.RemoveAsync(CacheKeys.TestRunResponse(runId), cancellationToken);

        if (replacedPlaceholder)
        {
            await notifier.ResultUpdatedAsync(runId, summary, cancellationToken);
        }
        else
        {
            await notifier.ResultAddedAsync(runId, summary, cancellationToken);
        }

        await notifier.DashboardChangedAsync(projectId, runId, cancellationToken);

        return summary;
    }
}
