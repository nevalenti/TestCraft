using TestCraft.Application.TestResults;

namespace TestCraft.Application.Common.Interfaces;

public interface ITestRunNotifier
{
    Task ResultAddedAsync(
        Guid runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    );
    Task ResultUpdatedAsync(
        Guid runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    );
    Task ResultDeletedAsync(
        Guid runId,
        Guid resultId,
        CancellationToken cancellationToken = default
    );
    Task RunStatusChangedAsync(
        Guid runId,
        string newStatus,
        CancellationToken cancellationToken = default
    );

    Task LogsAppendedAsync(
        Guid runId,
        IReadOnlyList<string> lines,
        CancellationToken cancellationToken = default
    );
}
