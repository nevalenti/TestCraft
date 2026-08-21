using TestCraft.Application.Features.TestResults;

namespace TestCraft.Application.Common.Interfaces;

public interface ITestRunNotifier
{
    Task ResultAddedAsync(
        TestRunId runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    );
    Task ResultUpdatedAsync(
        TestRunId runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    );
    Task ResultDeletedAsync(
        TestRunId runId,
        TestResultId resultId,
        CancellationToken cancellationToken = default
    );
    Task RunStatusChangedAsync(
        TestRunId runId,
        string newStatus,
        CancellationToken cancellationToken = default
    );

    Task LogsAppendedAsync(
        TestRunId runId,
        IReadOnlyList<string> lines,
        CancellationToken cancellationToken = default
    );
}
