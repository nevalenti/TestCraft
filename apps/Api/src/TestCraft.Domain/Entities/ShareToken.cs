namespace TestCraft.Domain.Entities;

public class ShareToken
{
    public ShareTokenId Id { get; set; }
    public TestRunId TestRunId { get; set; }
    public required string Token { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }

    public UserId CreatedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public TestRun? TestRun { get; set; }
}
