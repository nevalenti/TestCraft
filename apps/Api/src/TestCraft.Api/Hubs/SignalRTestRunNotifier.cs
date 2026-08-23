using Microsoft.AspNetCore.SignalR;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.TestResults;

namespace TestCraft.Api.Hubs;

public class SignalRTestRunNotifier(IHubContext<TestRunHub> hubContext) : ITestRunNotifier
{
    public Task ResultAddedAsync(
        TestRunId runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) =>
        hubContext
            .Clients.Group($"run:{runId}")
            .SendAsync("ResultAdded", result, cancellationToken);

    public Task ResultUpdatedAsync(
        TestRunId runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) =>
        hubContext
            .Clients.Group($"run:{runId}")
            .SendAsync("ResultUpdated", result, cancellationToken);

    public Task ResultDeletedAsync(
        TestRunId runId,
        TestResultId resultId,
        CancellationToken cancellationToken = default
    ) =>
        hubContext
            .Clients.Group($"run:{runId}")
            .SendAsync("ResultDeleted", resultId.ToString(), cancellationToken);

    public Task RunStatusChangedAsync(
        TestRunId runId,
        string newStatus,
        CancellationToken cancellationToken = default
    ) =>
        hubContext
            .Clients.Group($"run:{runId}")
            .SendAsync("RunStatusChanged", newStatus, cancellationToken);

    public Task LogsAppendedAsync(
        TestRunId runId,
        IReadOnlyList<string> lines,
        CancellationToken cancellationToken = default
    ) =>
        hubContext
            .Clients.Group($"run:{runId}")
            .SendAsync("LogsAppended", lines, cancellationToken);
}
