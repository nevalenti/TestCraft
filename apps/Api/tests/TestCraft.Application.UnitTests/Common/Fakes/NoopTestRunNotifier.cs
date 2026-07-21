using TestCraft.Application.TestResults;
using TestCraft.Application.TestRuns;

namespace TestCraft.Application.UnitTests.Common.Fakes;

internal sealed class NoopTestRunNotifier : ITestRunNotifier
{
    public Task ResultAddedAsync(
        Guid runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;

    public Task ResultUpdatedAsync(
        Guid runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;

    public Task ResultDeletedAsync(
        Guid runId,
        Guid resultId,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;

    public Task RunStatusChangedAsync(
        Guid runId,
        string newStatus,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;

    public Task LogsAppendedAsync(
        Guid runId,
        IReadOnlyList<string> lines,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;
}
