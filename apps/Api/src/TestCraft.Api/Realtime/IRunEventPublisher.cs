namespace TestCraft.Api.Realtime;

public interface IRunEventPublisher
{
    Task PublishRunAsync(TestRunId runId, string message);

    Task PublishDashboardAsync(ProjectId projectId, string message);
}

public sealed class LocalRunEventPublisher(RunEventBroker broker) : IRunEventPublisher
{
    public Task PublishRunAsync(TestRunId runId, string message)
    {
        broker.Publish(runId, message);

        return Task.CompletedTask;
    }

    public Task PublishDashboardAsync(ProjectId projectId, string message)
    {
        broker.PublishDashboard(projectId, message);

        return Task.CompletedTask;
    }
}
