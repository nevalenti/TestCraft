using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.TestResults;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.UnitTests.Common.Fakes;

internal sealed class NoopTestRunNotifier : ITestRunNotifier
{
    public Task ResultAddedAsync(
        TestRunId runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;

    public Task ResultUpdatedAsync(
        TestRunId runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;

    public Task ResultDeletedAsync(
        TestRunId runId,
        TestResultId resultId,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;

    public Task RunStatusChangedAsync(
        TestRunId runId,
        TestRunStatus newStatus,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;

    public Task LogsAppendedAsync(
        TestRunId runId,
        IReadOnlyList<string> lines,
        long lastSeq,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;

    public Task DashboardChangedAsync(
        ProjectId projectId,
        TestRunId runId,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;
}
