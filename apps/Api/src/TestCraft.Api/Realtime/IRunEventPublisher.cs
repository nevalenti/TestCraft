namespace TestCraft.Api.Realtime;

public interface IRunEventPublisher
{
    Task PublishRunAsync(TestRunId runId, string message);

    Task PublishDashboardAsync(ProjectId projectId, string message);
}
