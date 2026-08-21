namespace TestCraft.Domain.Entities;

public class RunLog
{
    public RunLogId Id { get; set; }
    public TestRunId RunId { get; set; }
    public required string Message { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public TestRun? Run { get; set; }
}
