namespace TestCraft.Application.Common.Interfaces;

public interface INotificationDispatcher
{
    Task DispatchRunCompletedAsync(
        ProjectId projectId,
        TestRunId runId,
        string runName,
        CancellationToken cancellationToken = default
    );

    Task RetryPendingDeliveriesAsync(CancellationToken cancellationToken = default);
}
