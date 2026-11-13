using System.Collections.Concurrent;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.TestResults;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

public sealed class FakeTestRunNotifier(ITestRunNotifier inner) : ITestRunNotifier
{
    private readonly ConcurrentQueue<(string Event, TestRunId RunId)> _events = new();

    public IReadOnlyList<string> ResultEventsFor(TestRunId runId) =>
        _events
            .Where(entry =>
                entry.RunId == runId && entry.Event.StartsWith("Result", StringComparison.Ordinal)
            )
            .Select(entry => entry.Event)
            .ToList();

    public Task ResultAddedAsync(
        TestRunId runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) =>
        Record(
            nameof(ResultAddedAsync),
            runId,
            inner.ResultAddedAsync(runId, result, cancellationToken)
        );

    public Task ResultUpdatedAsync(
        TestRunId runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) =>
        Record(
            nameof(ResultUpdatedAsync),
            runId,
            inner.ResultUpdatedAsync(runId, result, cancellationToken)
        );

    public Task ResultDeletedAsync(
        TestRunId runId,
        TestResultId resultId,
        CancellationToken cancellationToken = default
    ) =>
        Record(
            nameof(ResultDeletedAsync),
            runId,
            inner.ResultDeletedAsync(runId, resultId, cancellationToken)
        );

    public Task RunStatusChangedAsync(
        TestRunId runId,
        TestRunStatus newStatus,
        CancellationToken cancellationToken = default
    ) =>
        Record(
            nameof(RunStatusChangedAsync),
            runId,
            inner.RunStatusChangedAsync(runId, newStatus, cancellationToken)
        );

    public Task LogsAppendedAsync(
        TestRunId runId,
        IReadOnlyList<string> lines,
        long lastSeq,
        CancellationToken cancellationToken = default
    ) =>
        Record(
            nameof(LogsAppendedAsync),
            runId,
            inner.LogsAppendedAsync(runId, lines, lastSeq, cancellationToken)
        );

    public Task DashboardChangedAsync(
        ProjectId projectId,
        TestRunId runId,
        CancellationToken cancellationToken = default
    ) =>
        Record(
            nameof(DashboardChangedAsync),
            runId,
            inner.DashboardChangedAsync(projectId, runId, cancellationToken)
        );

    private Task Record(string name, TestRunId runId, Task forward)
    {
        _events.Enqueue((name, runId));

        return forward;
    }
}
