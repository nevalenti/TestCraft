namespace TestCraft.Domain.Entities;

public class RunLog
{
    public RunLogId Id { get; private set; }
    public TestRunId RunId { get; private set; }
    public string Message { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public TestRun? Run { get; set; }

    public static RunLog Create(TestRunId runId, string message) =>
        new()
        {
            Id = RunLogId.New(),
            RunId = runId,
            Message = message,
        };
}
