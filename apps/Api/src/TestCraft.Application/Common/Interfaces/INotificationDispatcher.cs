namespace TestCraft.Application.Common.Interfaces;

public interface INotificationDispatcher
{
    Task DispatchRunCompletedAsync(
        Guid projectId,
        Guid runId,
        string runName,
        CancellationToken cancellationToken = default
    );
}
