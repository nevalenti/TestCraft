namespace TestCraft.Domain.Entities;

public class EmailSubscription
{
    public EmailSubscriptionId Id { get; set; }
    public ProjectId ProjectId { get; set; }
    public required string Email { get; set; }
    public required string Events { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    public Project? Project { get; set; }
}
