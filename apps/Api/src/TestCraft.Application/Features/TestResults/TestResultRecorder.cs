using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Caching;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestResults;

public sealed record RecordedOutcome(
    TestResultStatus Status,
    string? Notes,
    long? DurationMs,
    DateTimeOffset ExecutedAt,
    DefectType? DefectType = null,
    string? DefectUrl = null
);

public sealed class TestResultRecorder(
    IApplicationDbContext context,
    ICacheService cache,
    ICurrentUser currentUser,
    ITestRunNotifier notifier
)
{
    public async Task<TestResultResponse> RecordAsync(
        ProjectId projectId,
        TestRunId runId,
        TestCaseId testCaseId,
        RecordedOutcome outcome,
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
            result.Record(
                outcome.Status,
                outcome.Notes,
                outcome.DefectType,
                outcome.DurationMs,
                outcome.ExecutedAt,
                currentUser.UserId,
                outcome.DefectUrl
            );
        }
        else
        {
            result = TestResult.Create(
                runId,
                testCaseId,
                outcome.Status,
                outcome.Notes,
                outcome.DefectType,
                outcome.DurationMs,
                outcome.ExecutedAt,
                currentUser.UserId,
                outcome.DefectUrl
            );
            context.TestResults.Add(result);
        }

        await context.SaveChangesAsync(cancellationToken);

        var summary = await TestResultResponse.LoadAsync(context, result.Id, cancellationToken);

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
