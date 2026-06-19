namespace TestCraft.Domain.Entities;

public class WebhookSubscription
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public required string Url { get; set; }
    public string? Secret { get; set; }
    public required string Events { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    public Project? Project { get; set; }
}
