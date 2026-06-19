using Microsoft.AspNetCore.SignalR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.TestResults;

namespace TestCraft.Api.Hubs;

public class SignalRTestRunNotifier(IHubContext<TestRunHub> hubContext) : ITestRunNotifier
{
    public Task ResultAddedAsync(
        Guid runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) =>
        hubContext
            .Clients.Group($"run:{runId}")
            .SendAsync("ResultAdded", result, cancellationToken);

    public Task ResultUpdatedAsync(
        Guid runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) =>
        hubContext
            .Clients.Group($"run:{runId}")
            .SendAsync("ResultUpdated", result, cancellationToken);

    public Task ResultDeletedAsync(
        Guid runId,
        Guid resultId,
        CancellationToken cancellationToken = default
    ) =>
        hubContext
            .Clients.Group($"run:{runId}")
            .SendAsync("ResultDeleted", resultId.ToString(), cancellationToken);

    public Task RunStatusChangedAsync(
        Guid runId,
        string newStatus,
        CancellationToken cancellationToken = default
    ) =>
        hubContext
            .Clients.Group($"run:{runId}")
            .SendAsync("RunStatusChanged", newStatus, cancellationToken);
}
