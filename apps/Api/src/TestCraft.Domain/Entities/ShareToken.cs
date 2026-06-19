namespace TestCraft.Domain.Entities;

public class ShareToken
{
    public Guid Id { get; set; }
    public Guid TestRunId { get; set; }
    public required string Token { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }

    public Guid CreatedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public TestRun? TestRun { get; set; }
}
