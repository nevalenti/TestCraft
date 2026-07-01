namespace TestCraft.Domain.Entities;

public class RunLog
{
    public Guid Id { get; set; }
    public Guid RunId { get; set; }
    public required string Message { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public TestRun? Run { get; set; }
}
