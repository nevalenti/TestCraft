using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.TestResults;

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
        string newStatus,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;

    public Task LogsAppendedAsync(
        TestRunId runId,
        IReadOnlyList<string> lines,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;
}
