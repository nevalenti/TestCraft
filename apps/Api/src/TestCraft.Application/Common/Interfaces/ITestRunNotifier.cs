using TestCraft.Application.Features.TestResults;
using TestCraft.Domain.Enums;

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
        TestRunStatus newStatus,
        CancellationToken cancellationToken = default
    );

    Task LogsAppendedAsync(
        TestRunId runId,
        IReadOnlyList<string> lines,
        long lastSeq,
        CancellationToken cancellationToken = default
    );

    Task DashboardChangedAsync(
        ProjectId projectId,
        TestRunId runId,
        CancellationToken cancellationToken = default
    );
}
